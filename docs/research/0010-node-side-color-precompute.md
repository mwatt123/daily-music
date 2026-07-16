# Research: Node-side path for pre-computing album cover colors

**Issue:** [#10](https://github.com/mwatt123/daily-music/issues/10) (parent map: #9, blocks #13)
**Branch:** `research/node-color-precompute`
**Date:** 2026-07-15

## Question

How do we run the dominant/secondary color extraction outside the browser, so
colors can be pre-computed at curation time and bundled? `src/dominantColor.ts`
currently depends on browser canvas (`<img>` + `getImageData`). Which Node-side
image-decoding path can feed the existing sampling/normalization logic, what has
to be refactored to make that logic renderer-agnostic, and is output parity with
the browser achievable?

---

## TL;DR

- **Recommended decoder: `sharp`.** Fetch the iTunes JPEG → `sharp(buf).resize(64, 64, { fit: "fill" }).ensureAlpha().raw().toBuffer(...)` → wrap the RGBA buffer into `Pixel[]` → reuse the existing pure functions unchanged. `@napi-rs/canvas` is the closest *literal* port of the browser path but adds nothing the algorithm needs; the pure-JS decoders (`jpeg-js` + a manual resampler, or `jimp`) are viable fallbacks if a native dependency is unacceptable.
- **Refactor is tiny.** The color math (`pickDominantColors`, `vividize`, `ensureContrast`, `finalizeColors`, …) is already renderer-agnostic — it operates on `Pixel[]`, not on the DOM. Only `extractDominantColors` + `loadImage` (lines 204–237) touch the browser. Extract the pure tail into `extractColorsFromPixels(pixels): ExtractedColors` and give each environment its own thin `imageUrl → Pixel[]` acquirer.
- **Exact byte-for-byte parity is NOT achievable, and does not need to be.** The browser's downscale resampling algorithm is explicitly implementation-defined, so even Chrome vs. Firefox can differ. But the downstream normalization (24-wide color quantization → `vividize` pins saturation/lightness → `ensureContrast`) is so lossy that only the *hue bucket* of the dominant/secondary pixels survives. Node output will match the browser at that level for essentially all real covers. The remaining divergence sources (resampling kernel, ICC handling, alpha) are enumerated below and are all controllable or moot for these specific images.

---

## 1. What the current algorithm actually needs (from `src/dominantColor.ts`)

Read in full. The browser dependency is confined to two functions; everything
else is pure and portable.

- **Pure color math (portable as-is):** `pickDominantColors(pixels: Pixel[])`
  (lines 36–69), `rgbToHsl`, `hslToRgb`, `vividize`, `relativeLuminance`,
  `contrastRatio`, `ensureContrast`, `toHex`, `finalizeColors`. These take
  `Pixel[]`/`RGB` and return strings/numbers — no DOM.
- **Browser-only pixel acquisition:** `extractDominantColors` (lines 204–227)
  and `loadImage` (lines 229–237). This is the *only* code that must be
  replaced for Node.

What the pure core requires from a decoder — the contract any Node path must satisfy:

1. **Raw, interleaved 8-bit RGBA pixels**, one `{ r, g, b, a }` per pixel
   (lines 216–219 build exactly this from the canvas `Uint8ClampedArray`).
2. **Channel order R,G,B,A**, values 0–255, **straight (non-premultiplied) alpha**
   — the browser's `getImageData` returns non-premultiplied `rgba-unorm8`
   ([MDN getImageData](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData)).
   Premultiplied alpha would corrupt the near-white / low-saturation filters.
3. **A 64×64 downscale.** The browser draws the image into a 64×64 canvas
   (`size = 64`, lines 207–213), i.e. **4096 sampled pixels**. Matching this
   count keeps the frequency histogram (and therefore which color "wins")
   comparable. `drawImage(img, 0, 0, 64, 64)` *stretches* to fill 64×64 ignoring
   aspect ratio — but iTunes covers are square (600×600, see below), so
   stretch == aspect-preserving here.

Crucially, the core is **highly tolerant of small pixel differences**:

- `quantize(value, step = 24)` (lines 21–23) snaps every channel into 24-wide
  buckets before counting, so two decoders that disagree by up to ~±12 per
  channel land in the same bucket.
- `vividize` (lines 117–122) then *discards* the source saturation and lightness
  entirely (`S = max(s, 0.7)`, `L = clamp(l, 0.48, 0.58)`), keeping only **hue**.
- `ensureContrast` (lines 150–174) only adjusts lightness.

Net: the only property of the extracted pixels that reaches the output is roughly
**the hue of the most-frequent saturated color bucket**. A Node decoder only has
to agree with the browser at *that* granularity — a far weaker bar than pixel parity.

---

## 2. The input is always a 600×600 JPEG (important for parity)

Every `coverArtUrl` in `src/albums.ts` ends in `/600x600bb.jpg`, produced in
`scripts/pickBestMatch.ts:54`
(`match.artworkUrl100.replace("100x100bb", "600x600bb")`). mzstatic serves
**JPEG at 600×600 even when the source master is a PNG/TIFF** — e.g.
`.../191400075450.png/600x600bb.jpg` and `.../mzi.hhgolqoz.tif/600x600bb.jpg`
both terminate in `600x600bb.jpg`.

Consequences:

- Both the browser (`<img src=coverArtUrl>`) and the Node path fetch the **same
  600×600 JPEG bytes**. Parity reduces to *decode + downscale-to-64 + color
  management* only — the source is identical.
- **Alpha is a non-issue for these images.** JPEG has no alpha channel, so every
  pixel is opaque (`a = 255`); the `a < 200` filter (line 40) never fires. Any
  decoder that reports RGB (or RGBA-with-255) is fine. `ensureAlpha()` in sharp
  just backfills 255.
- The 600×600 fetch is already an established pattern; there is no need to
  request a smaller variant, though `100x100bb` (already in the search response)
  would be even cheaper if we accept a coarser histogram.

The curation scripts already `fetch()` from Apple in Node (`scripts/fetchCoverArt.ts`),
so fetching the JPEG bytes at curation time is well-trodden ground.

---

## 3. Candidate decoders (primary-source comparison)

### `sharp` — recommended

- Native module wrapping **libvips**; accepts a `Buffer`/`ArrayBuffer`/`TypedArray`
  of "JPEG, PNG, WebP, AVIF, GIF, SVG or TIFF image data"
  ([constructor docs](https://sharp.pixelplumbing.com/api-constructor/)).
- Produces exactly the contract the core needs:
  ```js
  const { data, info } = await sharp(buf)
    .resize(64, 64, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  // data: interleaved RGBA, "left-to-right, top-to-bottom, without padding"
  // info: { width: 64, height: 64, channels: 4 }
  ```
  Raw output is "RGB or RGBA … interleaved", `ensureAlpha()` guarantees 4
  channels ([output docs](https://sharp.pixelplumbing.com/api-output/)).
- `fit: "fill"` reproduces the browser's stretch-to-exact-64×64 (moot for square
  covers, but explicit). Resampling **kernel** is selectable:
  `nearest | linear | cubic | mitchell | lanczos2 | lanczos3 (default) | mks2013 | mks2021`
  ([resize docs](https://sharp.pixelplumbing.com/api-resize/)).
- **Color management:** honors embedded ICC profiles by default
  (`ignoreIcc: false`); `failOn: "warning"` default is recommended for untrusted
  input ([constructor docs](https://sharp.pixelplumbing.com/api-constructor/)).
  Resize runs in **gamma-encoded sRGB (non-linear) by default** — linear-light
  resampling is opt-in in libvips/sharp
  ([libvips shrinking HOWTO](https://github.com/libvips/libvips/wiki/HOWTO----Image-shrinking),
  [libvips colour API](https://www.libvips.org/API/current/libvips-colour.html)).
  This *matches* mainstream browsers, which also resample in gamma space by
  default — a point in favor of parity (see §5).
- **Tradeoffs:** native/prebuilt binary (adds install weight; the repo currently
  ships only JS deps — `tsx`, `vite`, `vitest`). Runs only in Node, which is
  exactly the intent (curation-time precompute), so its non-portability to the
  browser is irrelevant.

### `@napi-rs/canvas` — closest literal port, but unnecessary

- Skia-backed Canvas 2D implementation for Node with **zero system dependencies**;
  implements `createCanvas`, `getContext("2d")`, `drawImage`, `getImageData`, and
  `loadImage` (from disk *or URL*)
  ([README](https://github.com/Brooooooklyn/canvas)).
- Would let `extractDominantColors` run **almost verbatim** — swap
  `document.createElement("canvas")` for `createCanvas(64, 64)` and `new Image()`
  for `loadImage`. Lowest-divergence option *in principle* because it exercises
  the same `drawImage` → `getImageData` pipeline shape.
- **But:** it's Skia, not the browser's Skia build, so it is *not* guaranteed
  bit-identical to Chrome either — it buys the appearance of parity, not a
  guarantee. And it's still a native module. Given the algorithm only needs a
  hue bucket (§1), sharp's cleaner buffer API is preferable; keep this as the
  option if we ever need literal canvas semantics.

### `jimp` — pure-JS fallback

- "Just JavaScript", **zero native dependencies**; decodes PNG/JPEG/BMP/GIF/TIFF
  ([docs](https://jimp-dev.github.io/jimp/)).
- Exposes raw RGBA directly via `bitmap.data` / `bitmap.width` / `bitmap.height`,
  and `resize()` defaults to a **2-pass bilinear** algorithm
  ([Jimp class docs](https://jimp-dev.github.io/jimp/api/jimp/classes/jimp/)).
  `bitmap.data` is already interleaved RGBA — trivially wrapped into `Pixel[]`.
- **Tradeoffs:** slower, pure-JS; bilinear-only (no lanczos). For a batch
  curation job over a few hundred covers this is fine. Best choice **if avoiding
  a native binary is a hard requirement.**

### `jpeg-js` (+ `pngjs`) — lowest-level pure-JS fallback

- `jpeg-js` is a "pure javascript JPEG encoder and decoder"; `decode()` returns
  `{ width, height, data }` with `data` as **RGBA** (`formatAsRGBA` defaults on),
  optional `useTArray` for a `Uint8Array`
  ([README](https://github.com/jpeg-js/jpeg-js)).
- Decodes at **full 600×600** and has **no resampler** — you'd have to write the
  downscale-to-64 yourself (box/bilinear average) to reproduce the 4096-pixel
  histogram, or skip resizing and sample all 360k pixels (changes histogram
  weighting and cost). More code, more parity risk than jimp. Only worth it if
  you want zero extra abstractions. (`pngjs` would only matter if we ever fetch
  actual PNG bytes — we don't, §2.)

---

## 4. Required refactor of `dominantColor.ts` (renderer-agnostic seam)

The color math is already pure; the change is to **name the seam** so both
environments share it.

1. **Extract the pure tail of `extractDominantColors`** into an exported
   function that takes pixels, not a URL:
   ```ts
   export function extractColorsFromPixels(pixels: Pixel[]): ExtractedColors {
     const { primary, secondary } = pickDominantColors(pixels);
     return finalizeColors(primary, secondary);
   }
   ```
   This is renderer-agnostic and unit-testable (unlike the current DOM wrapper,
   which the file comment on line 202 notes is deliberately untested).

2. **Define a decode-target constant** shared by both acquirers so the sample
   grid can't drift: `export const SAMPLE_SIZE = 64;`.

3. **Keep the browser acquirer** as the thin wrapper it already is — reduce
   `extractDominantColors` to: `loadImage → canvas 64×64 → getImageData → Pixel[]
   → extractColorsFromPixels`. No behavior change.

4. **Add a Node acquirer** (in a separate module so the browser bundle never
   imports `sharp`, e.g. `scripts/extractColorsNode.ts`):
   ```ts
   import sharp from "sharp";
   import { extractColorsFromPixels, SAMPLE_SIZE, type Pixel } from "../src/dominantColor";

   export async function extractDominantColorsNode(imageUrl: string): Promise<ExtractedColors> {
     const buf = Buffer.from(await (await fetch(imageUrl)).arrayBuffer());
     const { data } = await sharp(buf)
       .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: "fill" })
       .ensureAlpha()
       .raw()
       .toBuffer({ resolveWithObject: true });
     const pixels: Pixel[] = [];
     for (let i = 0; i < data.length; i += 4)
       pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] });
     return extractColorsFromPixels(pixels);
   }
   ```
   Same try/catch → `finalizeColors(FALLBACK, FALLBACK)` fallback semantics as the
   browser path (lines 223–226).

**Key boundary rule:** the browser bundle must not import the Node module (`sharp`
is native and would break Vite). Put the Node acquirer under `scripts/`, importing
only the pure exports from `src/dominantColor.ts`. The pure core stays the single
source of truth for the color math; only pixel *acquisition* forks per environment.

This also unblocks precompute-at-curation-time (the pattern ADR-0001 explicitly
chose *not* to use for colors): the curation scripts already write `coverArtUrl`
(`scripts/serializeAlbums.ts`), so adding `primary`/`secondary` fields alongside
it is a natural extension.

---

## 5. Parity assessment: browser canvas vs. Node

**Verdict: exact parity is impossible and unnecessary; hue-bucket parity is
achievable and is all the algorithm consumes.**

### Why exact parity is impossible
The Canvas spec does **not** define the resampling algorithm used when
`drawImage` scales down; `imageSmoothingEnabled` / `imageSmoothingQuality` are
**hints**, and the interpolation is implementation-defined
([MDN drawImage](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage)).
So the browser path isn't even self-consistent across browsers/versions — there
is no fixed target to match byte-for-byte. Any "parity" claim can only be
*perceptual / bucket-level*, not exact.

### Why bucket-level parity holds (the algorithm's tolerance)
Per §1: channels are quantized into 24-wide buckets, then `vividize` throws away
saturation and lightness, keeping only hue. Resampling-kernel differences move
individual channels by single-digit amounts — well inside a 24-wide bucket and
far below a perceptible hue shift. The *dominant bucket* (the mode of 4096
saturated pixels) is stable under these perturbations for real artwork. Edge
cases where it could flip: covers with two near-equally-frequent saturated
colors, where a few pixels of resampling difference tip which bucket has the
higher count. These are rare and, by construction, both candidates are already
"acceptable" dominant colors.

### Enumerated divergence sources and how each is handled
- **Resampling kernel.** Browser: implementation-defined (Chrome/Firefox use a
  bilinear/box-ish filter in gamma space). sharp default: **lanczos3**. To
  minimize divergence, set `kernel: "linear"` (bilinear) or `"cubic"`. jimp is
  bilinear by default. Because only the hue bucket survives, the kernel choice
  rarely changes the output; if we want the *closest* match, use
  `resize(64, 64, { fit: "fill", kernel: "linear" })`.
- **Color space / gamma of the resize.** Browsers resample in **gamma-encoded
  sRGB** (not linear light) by default; sharp/libvips **also** default to
  non-linear sRGB resize (linear is opt-in)
  ([libvips shrinking HOWTO](https://github.com/libvips/libvips/wiki/HOWTO----Image-shrinking)).
  So **do not enable** sharp's linear/gamma options — the defaults already align.
- **ICC / color management.** Browsers color-manage decoded JPEGs to the output
  space; `getImageData` defaults to the **sRGB** color space
  ([MDN getImageData](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData)).
  sharp honors embedded ICC by default (`ignoreIcc: false`). iTunes 600×600bb
  JPEGs are generally untagged / sRGB, so both paths converge on sRGB. If a rare
  cover carries a wide-gamut profile, results could differ by a small hue amount;
  acceptable given the tolerance above. (`@napi-rs/canvas` / Skia would color-
  manage similarly.)
- **Alpha handling.** Both paths use **straight (non-premultiplied)** alpha; and
  since the input is JPEG, alpha is always 255 (§2), so this source of divergence
  is moot for this dataset. Do *not* use a decoder path that premultiplies.
- **Sample count.** Keep the 64×64 (4096-pixel) grid identical on both sides
  (the shared `SAMPLE_SIZE` constant) so the histogram weighting matches.

### Recommended parity-maximizing Node config
`sharp(buf).resize(64, 64, { fit: "fill", kernel: "linear" }).ensureAlpha().raw()`
with default (non-linear, ICC-honoring) color handling. Validate empirically by
running both paths over the current `src/albums.ts` covers and diffing the
resulting hex pairs; expect most to be identical and the rest within a small hue
delta that `vividize`/`ensureContrast` render visually equivalent.

---

## Recommendation

Adopt **`sharp`** for the Node-side precompute. Refactor `src/dominantColor.ts`
to expose `extractColorsFromPixels(pixels)` + a shared `SAMPLE_SIZE`, leave the
pure color math untouched, and add a `scripts/`-scoped Node acquirer that fetches
the 600×600 JPEG, resizes to 64×64 (`fit: "fill"`, `kernel: "linear"` for closest
match), and reads raw RGBA. Output will match the browser at the only granularity
the algorithm preserves (hue bucket). If a native binary is unacceptable, fall
back to **`jimp`** (pure-JS, bilinear, `bitmap.data`) with the same seam.

## Sources

- sharp resize — https://sharp.pixelplumbing.com/api-resize/
- sharp output (raw / ensureAlpha) — https://sharp.pixelplumbing.com/api-output/
- sharp constructor (Buffer input, ICC, failOn) — https://sharp.pixelplumbing.com/api-constructor/
- @napi-rs/canvas — https://github.com/Brooooooklyn/canvas
- jimp — https://jimp-dev.github.io/jimp/ and https://jimp-dev.github.io/jimp/api/jimp/classes/jimp/
- jpeg-js — https://github.com/jpeg-js/jpeg-js
- MDN drawImage (implementation-defined resampling, smoothing hints) — https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
- MDN getImageData (RGBA unorm8, sRGB default, non-premultiplied) — https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData
- libvips image shrinking / linear-light is opt-in — https://github.com/libvips/libvips/wiki/HOWTO----Image-shrinking
- libvips colour API — https://www.libvips.org/API/current/libvips-colour.html
