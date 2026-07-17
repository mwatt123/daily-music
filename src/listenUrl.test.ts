import { describe, it, expect } from "vitest";
import { listenUrlFor } from "./listenUrl";

describe("listenUrlFor", () => {
  it("uses the album's curated listen URL when one is resolved", () => {
    expect(
      listenUrlFor({
        artist: "Arcade Fire",
        title: "Funeral",
        listenUrl: "https://music.apple.com/us/album/funeral/1055842666",
      }),
    ).toBe("https://music.apple.com/us/album/funeral/1055842666");
  });

  it("falls back to a zero-network Apple Music search URL when unresolved", () => {
    expect(listenUrlFor({ artist: "Radiohead", title: "In Rainbows" })).toBe(
      "https://music.apple.com/search?term=Radiohead%20In%20Rainbows",
    );
  });

  it("url-encodes special characters in the search fallback", () => {
    expect(listenUrlFor({ artist: "Beyoncé", title: "B'Day & More" })).toContain(
      encodeURIComponent("Beyoncé B'Day & More"),
    );
  });
});
