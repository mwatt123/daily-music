import { describe, expect, it } from "vitest";
import { applyVerifiedChanges, type VerifiedChange } from "./applyVerifiedChanges";
import type { Album } from "../src/albums";

describe("applyVerifiedChanges", () => {
  it("appends a new album for an add change", () => {
    const current: Album[] = [
      { title: "Rumours", artist: "Fleetwood Mac", year: 1977, coverArtUrl: "a" },
    ];
    const changes: VerifiedChange[] = [
      { type: "add", artist: "Alvvays", toAlbum: "Blue Rev", coverArtUrl: "b", year: 2022 },
    ];

    expect(applyVerifiedChanges(current, changes)).toEqual([
      { title: "Rumours", artist: "Fleetwood Mac", year: 1977, coverArtUrl: "a" },
      { title: "Blue Rev", artist: "Alvvays", year: 2022, coverArtUrl: "b" },
    ]);
  });

  it("removes the old entries and appends the new one for a replace change", () => {
    const current: Album[] = [
      { title: "Let It Be", artist: "The Beatles", year: 1970, coverArtUrl: "a" },
      { title: "Revolver", artist: "The Beatles", year: 1966, coverArtUrl: "b" },
      { title: "Rumours", artist: "Fleetwood Mac", year: 1977, coverArtUrl: "c" },
    ];
    const changes: VerifiedChange[] = [
      {
        type: "replace",
        artist: "The Beatles",
        fromAlbums: ["Let It Be", "Revolver"],
        toAlbum: "Abbey Road",
        coverArtUrl: "d",
        year: 1969,
      },
    ];

    expect(applyVerifiedChanges(current, changes)).toEqual([
      { title: "Rumours", artist: "Fleetwood Mac", year: 1977, coverArtUrl: "c" },
      { title: "Abbey Road", artist: "The Beatles", year: 1969, coverArtUrl: "d" },
    ]);
  });

  it("applies multiple changes together without disturbing untouched albums", () => {
    const current: Album[] = [
      { title: "Rumours", artist: "Fleetwood Mac", year: 1977, coverArtUrl: "a" },
      { title: "Let It Be", artist: "The Beatles", year: 1970, coverArtUrl: "b" },
    ];
    const changes: VerifiedChange[] = [
      { type: "add", artist: "Alvvays", toAlbum: "Blue Rev", coverArtUrl: "c", year: 2022 },
      {
        type: "replace",
        artist: "The Beatles",
        fromAlbums: ["Let It Be"],
        toAlbum: "Abbey Road",
        coverArtUrl: "d",
        year: 1969,
      },
    ];

    expect(applyVerifiedChanges(current, changes)).toEqual([
      { title: "Rumours", artist: "Fleetwood Mac", year: 1977, coverArtUrl: "a" },
      { title: "Blue Rev", artist: "Alvvays", year: 2022, coverArtUrl: "c" },
      { title: "Abbey Road", artist: "The Beatles", year: 1969, coverArtUrl: "d" },
    ]);
  });
});
