// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { initNewTab } from "./newtab";
import type { VisitorIdStore } from "./visitorId";
import type { Album } from "./albums";
import type { ExtractedColors } from "./dominantColor";

const albums: Album[] = [
  { title: "In Rainbows", artist: "Radiohead", year: 2007, coverArtUrl: "cover-a" },
  { title: "Rumours", artist: "Fleetwood Mac", year: 1977, coverArtUrl: "cover-b" },
];

const colors: Record<string, ExtractedColors> = {
  "cover-a": { primary: "#111111", secondary: "#eeeeee" },
  "cover-b": { primary: "#222222", secondary: "#dddddd" },
};

/** Store pre-seeded with a fixed id, so album selection is deterministic. */
function seededStore(id = "visitor-fixed"): VisitorIdStore {
  return { get: () => id, set: () => {} };
}

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  document.documentElement.style.removeProperty("--color-primary");
  document.documentElement.style.removeProperty("--color-secondary");
});

describe("initNewTab", () => {
  it("renders today's album into the container", async () => {
    const container = document.querySelector<HTMLDivElement>("#app")!;

    const album = await initNewTab({
      container,
      store: seededStore(),
      albums,
      colors,
      date: "2026-07-16",
    });

    expect(container.querySelector(".title")?.textContent).toBe(album.title);
    expect(container.querySelector(".meta")?.textContent).toContain(album.artist);
    expect(container.querySelector<HTMLImageElement>(".cover-art")?.getAttribute("src")).toBe(
      album.coverArtUrl,
    );
  });

  it("applies the album's precomputed colors to the CSS custom properties", async () => {
    const container = document.querySelector<HTMLDivElement>("#app")!;

    const album = await initNewTab({
      container,
      store: seededStore(),
      albums,
      colors,
      date: "2026-07-16",
    });

    const root = document.documentElement.style;
    expect(root.getPropertyValue("--color-primary")).toBe(colors[album.coverArtUrl].primary);
    expect(root.getPropertyValue("--color-secondary")).toBe(colors[album.coverArtUrl].secondary);
  });

  it("leaves the fallback colors in place when the cover has no precomputed entry", async () => {
    const container = document.querySelector<HTMLDivElement>("#app")!;

    await initNewTab({
      container,
      store: seededStore(),
      albums,
      colors: {}, // nothing precomputed
      date: "2026-07-16",
    });

    const root = document.documentElement.style;
    expect(root.getPropertyValue("--color-primary")).toBe("");
    expect(root.getPropertyValue("--color-secondary")).toBe("");
  });

  it("picks the same album for the same visitor and date across renders", async () => {
    const container = document.querySelector<HTMLDivElement>("#app")!;
    const deps = { container, store: seededStore(), albums, colors, date: "2026-07-16" };

    const first = await initNewTab(deps);
    const second = await initNewTab(deps);

    expect(second.title).toBe(first.title);
  });
});
