import { describe, it, expect } from "vitest";
import { listenUrlFor } from "./listenUrl";

describe("listenUrlFor", () => {
  it("builds a universal album.link from the baked Apple Music album id", () => {
    expect(
      listenUrlFor({
        artist: "Arcade Fire",
        title: "Funeral",
        listenUrl: "https://music.apple.com/us/album/funeral/1249417623",
      }),
    ).toBe("https://album.link/i/1249417623");
  });

  it("extracts the id even when the Apple URL carries a query or fragment", () => {
    expect(
      listenUrlFor({
        artist: "Radiohead",
        title: "In Rainbows",
        listenUrl: "https://music.apple.com/us/album/in-rainbows/1109714933?uo=4",
      }),
    ).toBe("https://album.link/i/1109714933");
  });

  it("takes the trailing id even when the album's title is itself numeric", () => {
    // Apple slugifies a numeric title into the path: /album/7/1353635536 —
    // the id is the LAST segment, not the first numeric one.
    expect(
      listenUrlFor({
        artist: "Beach House",
        title: "7",
        listenUrl: "https://music.apple.com/us/album/7/1353635536",
      }),
    ).toBe("https://album.link/i/1353635536");
  });

  it("falls back to a zero-network Apple Music search URL when there is no listenUrl", () => {
    expect(listenUrlFor({ artist: "Radiohead", title: "In Rainbows" })).toBe(
      "https://music.apple.com/search?term=Radiohead%20In%20Rainbows",
    );
  });

  it("url-encodes special characters in the search fallback", () => {
    expect(listenUrlFor({ artist: "Beyoncé", title: "B'Day & More" })).toContain(
      encodeURIComponent("Beyoncé B'Day & More"),
    );
  });

  it("uses the Apple album page itself if a listenUrl somehow carries no id", () => {
    expect(
      listenUrlFor({ artist: "X", title: "Y", listenUrl: "https://music.apple.com/us/album/y" }),
    ).toBe("https://music.apple.com/us/album/y");
  });
});
