import { describe, it, expect } from "vitest";
import { pickDominantColors, vividize, rgbToHsl } from "./dominantColor";
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
