import { describe, expect, it } from "vitest";
import { pickBestMatch, type ITunesSearchResult } from "./pickBestMatch";

function result(overrides: Partial<ITunesSearchResult>): ITunesSearchResult {
  return {
    wrapperType: "collection",
    collectionType: "Album",
    artistName: "The Beatles",
    collectionName: "Abbey Road",
    artworkUrl100: "https://example.com/100x100bb.jpg",
    releaseDate: "1969-09-26T07:00:00Z",
    ...overrides,
  };
}

describe("pickBestMatch", () => {
  it("returns the upgraded cover art URL and release year for a matching result", () => {
    const results = [result({})];

    expect(pickBestMatch(results, { artist: "The Beatles", album: "Abbey Road" })).toEqual({
      coverArtUrl: "https://example.com/600x600bb.jpg",
      year: 1969,
    });
  });

  it("excludes results that aren't a wrapperType/collectionType Album", () => {
    const results = [
      result({ wrapperType: "track", collectionType: undefined }),
    ];

    expect(pickBestMatch(results, { artist: "The Beatles", album: "Abbey Road" })).toBeNull();
  });

  it("matches case-insensitively", () => {
    const results = [
      result({ artistName: "the beatles", collectionName: "ABBEY ROAD" }),
    ];

    expect(pickBestMatch(results, { artist: "The Beatles", album: "Abbey Road" })).toEqual({
      coverArtUrl: "https://example.com/600x600bb.jpg",
      year: 1969,
    });
  });

  it("returns null when no result matches", () => {
    const results = [result({ artistName: "Wings" })];

    expect(pickBestMatch(results, { artist: "The Beatles", album: "Abbey Road" })).toBeNull();
  });

  it("rejects a decoy fuzzy-search result and picks the actual match, regardless of order", () => {
    const results = [
      result({ collectionName: "Abbey Road (2019 Remaster) [Live Bootleg]" }),
      result({ collectionName: "Abbey Road" }),
    ];

    expect(pickBestMatch(results, { artist: "The Beatles", album: "Abbey Road" })).toEqual({
      coverArtUrl: "https://example.com/600x600bb.jpg",
      year: 1969,
    });
  });
});
