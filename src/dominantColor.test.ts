import { describe, it, expect } from "vitest";
import {
  pickDominantColors,
  vividize,
  rgbToHsl,
  relativeLuminance,
  contrastRatio,
  ensureContrast,
} from "./dominantColor";
import type { Pixel } from "./dominantColor";

describe("pickDominantColors", () => {
  it("picks the majority color as primary", () => {
    const pixels: Pixel[] = [
      ...Array(80).fill({ r: 255, g: 0, b: 0, a: 255 }),
      ...Array(20).fill({ r: 0, g: 0, b: 255, a: 255 }),
    ];

    const { primary } = pickDominantColors(pixels);

    expect(primary).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("picks a sufficiently different color as secondary", () => {
    const pixels: Pixel[] = [
      ...Array(80).fill({ r: 255, g: 0, b: 0, a: 255 }),
      ...Array(20).fill({ r: 0, g: 0, b: 255, a: 255 }),
    ];

    const { secondary } = pickDominantColors(pixels);

    expect(secondary).toEqual({ r: 0, g: 0, b: 255 });
  });

  it("ignores near-white, near-black, and low-saturation pixels", () => {
    const pixels: Pixel[] = [
      ...Array(90).fill({ r: 250, g: 250, b: 250, a: 255 }), // near-white
      ...Array(5).fill({ r: 10, g: 10, b: 10, a: 255 }), // near-black
      ...Array(5).fill({ r: 20, g: 140, b: 60, a: 255 }), // the only saturated color
    ];

    const { primary } = pickDominantColors(pixels);

    expect(primary).toEqual({ r: 20, g: 140, b: 60 });
  });

  it("ignores transparent pixels", () => {
    const pixels: Pixel[] = [
      ...Array(90).fill({ r: 255, g: 0, b: 0, a: 0 }), // transparent, should not count
      ...Array(10).fill({ r: 0, g: 200, b: 100, a: 255 }),
    ];

    const { primary } = pickDominantColors(pixels);

    expect(primary).toEqual({ r: 0, g: 200, b: 100 });
  });

  it("falls back to a default pair when no pixel qualifies", () => {
    const pixels: Pixel[] = Array(100).fill({ r: 250, g: 250, b: 250, a: 255 });

    const { primary, secondary } = pickDominantColors(pixels);

    expect(primary).not.toBeNull();
    expect(secondary).not.toBeNull();
  });
});

describe("vividize", () => {
  it("boosts low-saturation colors to at least 70% saturation", () => {
    const muddyBrown = { r: 130, g: 110, b: 90 };

    const result = vividize(muddyBrown);
    const [, s] = rgbToHsl(result.r, result.g, result.b);

    expect(s).toBeGreaterThanOrEqual(0.69);
  });

  it("clamps lightness into the 48%-58% band", () => {
    const veryDark = { r: 20, g: 60, b: 30 };
    const veryLight = { r: 230, g: 245, b: 235 };

    const darkResult = vividize(veryDark);
    const lightResult = vividize(veryLight);
    const [, , lDark] = rgbToHsl(darkResult.r, darkResult.g, darkResult.b);
    const [, , lLight] = rgbToHsl(lightResult.r, lightResult.g, lightResult.b);

    expect(lDark).toBeGreaterThanOrEqual(0.47);
    expect(lDark).toBeLessThanOrEqual(0.59);
    expect(lLight).toBeGreaterThanOrEqual(0.47);
    expect(lLight).toBeLessThanOrEqual(0.59);
  });

  it("preserves hue for an already-vivid color", () => {
    const pureRed = { r: 255, g: 0, b: 0 };
    const [hueBefore] = rgbToHsl(pureRed.r, pureRed.g, pureRed.b);

    const result = vividize(pureRed);
    const [hueAfter] = rgbToHsl(result.r, result.g, result.b);

    expect(Math.abs(hueAfter - hueBefore)).toBeLessThan(2);
  });
});

describe("relativeLuminance", () => {
  it("returns ~1 for white", () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 2);
  });

  it("returns ~0 for black", () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 2);
  });
});

describe("contrastRatio", () => {
  it("returns ~21 for black vs white", () => {
    const ratio = contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });

    expect(ratio).toBeCloseTo(21, 0);
  });

  it("returns 1 for identical colors", () => {
    const color = { r: 130, g: 80, b: 200 };

    expect(contrastRatio(color, color)).toBeCloseTo(1, 5);
  });

  it("is symmetric regardless of argument order", () => {
    const a = { r: 255, g: 90, b: 54 };
    const b = { r: 30, g: 60, b: 140 };

    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 5);
  });
});

describe("ensureContrast", () => {
  it("leaves a color unchanged if it already meets the contrast target", () => {
    const background = { r: 255, g: 220, b: 200 };
    const alreadyLegible = { r: 10, g: 10, b: 10 };

    const result = ensureContrast(alreadyLegible, background);

    expect(result).toEqual(alreadyLegible);
  });

  it("adjusts lightness until the result meets a 4.5:1 contrast ratio against the background", () => {
    const background = { r: 200, g: 90, b: 90 };
    const tooClose = { r: 210, g: 100, b: 100 };

    const result = ensureContrast(tooClose, background);

    expect(contrastRatio(result, background)).toBeGreaterThanOrEqual(4.5);
  });

  it("preserves hue while adjusting lightness", () => {
    const background = { r: 60, g: 60, b: 200 };
    const tooClose = { r: 70, g: 70, b: 210 };
    const [hueBefore] = rgbToHsl(tooClose.r, tooClose.g, tooClose.b);

    const result = ensureContrast(tooClose, background);
    const [hueAfter] = rgbToHsl(result.r, result.g, result.b);

    expect(Math.abs(hueAfter - hueBefore)).toBeLessThan(2);
  });

  it("produces a legible pair even when primary and secondary start out identical", () => {
    const color = { r: 255, g: 90, b: 54 };

    const result = ensureContrast(color, color);

    expect(contrastRatio(result, color)).toBeGreaterThanOrEqual(4.5);
  });

  it("meets the contrast target against a dark background by lightening", () => {
    const background = { r: 20, g: 20, b: 30 };
    const tooClose = { r: 40, g: 40, b: 55 };

    const result = ensureContrast(tooClose, background);

    expect(contrastRatio(result, background)).toBeGreaterThanOrEqual(4.5);
  });
});
