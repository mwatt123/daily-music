export interface Pixel {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface ExtractedColors {
  primary: string;
  secondary: string;
}

const FALLBACK: RGB = { r: 255, g: 90, b: 54 };

/**
 * Edge length of the square pixel grid both acquirers sample the artwork into
 * (64x64 = 4096 pixels). Shared so the browser canvas and the Node precompute
 * build the same-sized frequency histogram and can't drift apart.
 */
export const SAMPLE_SIZE = 64;

function quantize(value: number, step = 24): number {
  return Math.round(value / step) * step;
}

function colorDistance(a: RGB, b: RGB): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

/**
 * Finds the two most frequent sufficiently-distinct colors among the given
 * pixels, ignoring transparent, near-white, near-black, and low-saturation
 * ("gray") pixels -- these tend to be background padding rather than the
 * artwork's actual color. Falls back to a fixed color pair if nothing
 * qualifies (e.g. a fully monochrome or transparent image).
 */
export function pickDominantColors(pixels: Pixel[]): { primary: RGB; secondary: RGB } {
  const buckets = new Map<string, { count: number; color: RGB }>();

  for (const { r, g, b, a } of pixels) {
    if (a < 200) continue;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const isNearWhite = min > 235;
    const isNearBlack = max < 20;
    const isLowSaturation = max - min < 15;
    if (isNearWhite || isNearBlack || isLowSaturation) continue;

    const key = `${quantize(r)},${quantize(g)},${quantize(b)}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.count++;
    } else {
      buckets.set(key, { count: 1, color: { r, g, b } });
    }
  }

  const sorted = [...buckets.values()].sort((a, b) => b.count - a.count);
  if (sorted.length === 0) {
    return { primary: FALLBACK, secondary: FALLBACK };
  }

  const primary = sorted[0].color;
  const secondary =
    sorted.find((c) => colorDistance(c.color, primary) > 60)?.color ??
    sorted[Math.min(1, sorted.length - 1)].color;

  return { primary, secondary };
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): RGB {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const hNorm = h / 360;
  return {
    r: Math.round(hue2rgb(hNorm + 1 / 3) * 255),
    g: Math.round(hue2rgb(hNorm) * 255),
    b: Math.round(hue2rgb(hNorm - 1 / 3) * 255),
  };
}

/**
 * Forces a color into a "reads as light" range: saturated and mid-bright.
 * Raw dominant colors are often muddy (browns, dusty grays) or too close in
 * lightness to a light page background to show up at all -- this fixes both
 * by pinning saturation/lightness regardless of what the source pixel was.
 */
export function vividize(color: RGB): RGB {
  const [h, s, l] = rgbToHsl(color.r, color.g, color.b);
  const vividS = Math.max(s, 0.7);
  const vividL = Math.min(Math.max(l, 0.48), 0.58);
  return hslToRgb(h, vividS, vividL);
}

/** WCAG relative luminance of an sRGB color, in [0, 1]. */
export function relativeLuminance({ r, g, b }: RGB): number {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two colors, in [1, 21]. Order-independent. */
export function contrastRatio(a: RGB, b: RGB): number {
  const lA = relativeLuminance(a);
  const lB = relativeLuminance(b);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Adjusts `color`'s lightness (hue and saturation untouched) until its
 * contrast ratio against `background` meets `minRatio`, pushing toward
 * whichever end of the lightness scale (black or white) contrasts better.
 * Two independently-vivid colors aren't guaranteed to be legible together,
 * so this is the seam that guarantees text stays readable regardless of
 * what the source artwork's colors happen to be.
 */
export function ensureContrast(color: RGB, background: RGB, minRatio = 4.5): RGB {
  if (contrastRatio(color, background) >= minRatio) return color;

  const [h, s, l] = rgbToHsl(color.r, color.g, color.b);
  const towardWhite = contrastRatio(hslToRgb(h, s, 1), background);
  const towardBlack = contrastRatio(hslToRgb(h, s, 0), background);
  const target = towardWhite >= towardBlack ? 1 : 0;

  let lo = l;
  let hi = target;
  let best = hslToRgb(h, s, target);

  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const candidate = hslToRgb(h, s, mid);
    if (contrastRatio(candidate, background) >= minRatio) {
      best = candidate;
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return best;
}

function toHex({ r, g, b }: RGB): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

/**
 * Vividizes primary and forces secondary's lightness to stay legible against
 * it (see ensureContrast). Applied uniformly whether the pair came from real
 * pixels or the FALLBACK constant, so an extraction failure can't produce an
 * illegible primary/secondary pair by accident.
 */
function finalizeColors(primary: RGB, secondary: RGB): ExtractedColors {
  const vividPrimary = vividize(primary);
  const vividSecondary = ensureContrast(vividize(secondary), vividPrimary);
  return { primary: toHex(vividPrimary), secondary: toHex(vividSecondary) };
}

/**
 * The renderer-agnostic core: turns sampled pixels into a vivid, contrast-safe
 * primary/secondary pair. Both the browser canvas path and the Node precompute
 * path acquire pixels their own way, then hand off here. Passing no qualifying
 * pixels (e.g. an empty array) yields the FALLBACK pair, which doubles as the
 * failure color for either acquirer.
 */
export function extractColorsFromPixels(pixels: Pixel[]): ExtractedColors {
  const { primary, secondary } = pickDominantColors(pixels);
  return finalizeColors(primary, secondary);
}

/**
 * Loads the image, samples its pixels via a small offscreen canvas, and
 * returns a vivid, contrast-safe primary/secondary color pair extracted
 * from it. Thin, DOM-dependent wrapper around the pure functions above --
 * not unit tested, same as getVisitorId's cookie access.
 */
export async function extractDominantColors(imageUrl: string): Promise<ExtractedColors> {
  try {
    const img = await loadImage(imageUrl);
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return extractColorsFromPixels([]);
    ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

    const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE); // throws if canvas is tainted
    const pixels: Pixel[] = [];
    for (let i = 0; i < data.length; i += 4) {
      pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] });
    }

    return extractColorsFromPixels(pixels);
  } catch (err) {
    console.warn("dominant color extraction failed, using fallback", err);
    return extractColorsFromPixels([]);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
