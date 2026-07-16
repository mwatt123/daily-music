import { describe, expect, it } from "vitest";
import { refreshCoverArt } from "./refreshCoverArt";
import type { CoverArt } from "./applyReviewDecisions";
import type { Album } from "../src/albums";

describe("refreshCoverArt", () => {
  it("updates year and coverArtUrl for a matched album, keeping the title", () => {
    const current: Album[] = [{ title: "Homogenic", artist: "Björk", year: 1900, coverArtUrl: "wrong" }];
    const fresh = new Map<string, CoverArt>([["Björk|||Homogenic", { coverArtUrl: "right", year: 1997 }]]);

    expect(refreshCoverArt(current, fresh)).toEqual([
      { title: "Homogenic", artist: "Björk", year: 1997, coverArtUrl: "right" },
    ]);
  });

  it("leaves albums with no fresh match untouched", () => {
    const current: Album[] = [{ title: "Rumours", artist: "Fleetwood Mac", year: 1977, coverArtUrl: "a" }];

    expect(refreshCoverArt(current, new Map())).toEqual(current);
  });
});
