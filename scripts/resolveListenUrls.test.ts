import { describe, it, expect } from "vitest";
import { listenUrlFromResult } from "./resolveListenUrls";
import type { ITunesSearchResult } from "./pickBestMatch";

function result(collectionViewUrl?: string): ITunesSearchResult {
  return {
    wrapperType: "collection",
    collectionType: "Album",
    artistName: "Radiohead",
    collectionName: "In Rainbows",
    artworkUrl100: "art",
    releaseDate: "2007-10-10",
    collectionViewUrl,
  };
}

describe("listenUrlFromResult", () => {
  it("strips the tracking query to a clean album URL", () => {
    expect(
      listenUrlFromResult(result("https://music.apple.com/us/album/in-rainbows/1109714933?uo=4")),
    ).toBe("https://music.apple.com/us/album/in-rainbows/1109714933");
  });

  it("leaves an already-clean URL unchanged", () => {
    expect(
      listenUrlFromResult(result("https://music.apple.com/us/album/in-rainbows/1109714933")),
    ).toBe("https://music.apple.com/us/album/in-rainbows/1109714933");
  });

  it("returns null when the result carries no album URL", () => {
    expect(listenUrlFromResult(result(undefined))).toBeNull();
  });
});
