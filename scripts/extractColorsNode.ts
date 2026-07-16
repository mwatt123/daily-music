import sharp from "sharp";
import {
  extractColorsFromPixels,
  SAMPLE_SIZE,
  type ExtractedColors,
  type Pixel,
} from "../src/dominantColor";

/**
 * Node-side equivalent of the browser's `extractDominantColors`: fetches the
 * cover JPEG, downscales it to the shared SAMPLE_SIZE grid with `sharp`, reads
 * raw RGBA, and hands the pixels to the same pure color core. The research
 * (docs/research/0010-node-side-color-precompute.md) recommends a bilinear
 * kernel for closest match to the browser's gamma-space resample; sharp 0.33
 * doesn't expose `linear`, so we use `cubic` -- the nearest low-ringing
 * interpolator. This barely affects output: the color core quantizes into
 * 24-wide buckets and keeps only hue, so kernel differences don't survive. On
 * any failure it returns the FALLBACK pair (via an empty pixel array), matching
 * the browser path's catch behavior.
 */
export async function extractDominantColorsNode(
  imageUrl: string,
): Promise<ExtractedColors> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${imageUrl}`);
    const buffer = Buffer.from(await response.arrayBuffer());

    const { data } = await sharp(buffer)
      .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: "fill", kernel: "cubic" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels: Pixel[] = [];
    for (let i = 0; i < data.length; i += 4) {
      pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] });
    }

    return extractColorsFromPixels(pixels);
  } catch (err) {
    console.warn(`color precompute failed for ${imageUrl}, using fallback`, err);
    return extractColorsFromPixels([]);
  }
}
