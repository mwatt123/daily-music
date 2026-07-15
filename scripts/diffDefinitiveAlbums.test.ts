import { describe, expect, it } from "vitest";
import { diffDefinitiveAlbums } from "./diffDefinitiveAlbums";
import type { Album } from "../src/albums";
import type { DefinitiveAlbumPick } from "./selectDefinitiveAlbums";

describe("diffDefinitiveAlbums", () => {
  it("adds a pick for an artist with no current entries", () => {
    const current: Album[] = [];
    const picks: DefinitiveAlbumPick[] = [
      { artist: "Alvvays", album: "Blue Rev", confidence: "high" },
    ];

    expect(diffDefinitiveAlbums(current, picks)).toEqual([
      { type: "add", artist: "Alvvays", toAlbum: "Blue Rev", confidence: "high" },
    ]);
  });

  it("produces no change when the current single entry already matches the pick", () => {
    const current: Album[] = [
      { title: "Blue Rev", artist: "Alvvays", year: 2022, coverArtUrl: "a" },
    ];
    const picks: DefinitiveAlbumPick[] = [
      { artist: "Alvvays", album: "Blue Rev", confidence: "high" },
    ];

    expect(diffDefinitiveAlbums(current, picks)).toEqual([]);
  });

  it("replaces the current entry when it differs from the pick", () => {
    const current: Album[] = [
      { title: "Let It Be", artist: "The Beatles", year: 1970, coverArtUrl: "a" },
    ];
    const picks: DefinitiveAlbumPick[] = [
      { artist: "The Beatles", album: "Abbey Road", confidence: "high" },
    ];

    expect(diffDefinitiveAlbums(current, picks)).toEqual([
      {
        type: "replace",
        artist: "The Beatles",
        fromAlbums: ["Let It Be"],
        toAlbum: "Abbey Road",
        confidence: "high",
      },
    ]);
  });

  it("collapses multiple current entries down to the pick, even when the pick is among them", () => {
    const current: Album[] = [
      { title: "Let It Be", artist: "The Beatles", year: 1970, coverArtUrl: "a" },
      { title: "Abbey Road", artist: "The Beatles", year: 1969, coverArtUrl: "b" },
      { title: "Revolver", artist: "The Beatles", year: 1966, coverArtUrl: "c" },
    ];
    const picks: DefinitiveAlbumPick[] = [
      { artist: "The Beatles", album: "Abbey Road", confidence: "high" },
    ];

    expect(diffDefinitiveAlbums(current, picks)).toEqual([
      {
        type: "replace",
        artist: "The Beatles",
        fromAlbums: ["Let It Be", "Abbey Road", "Revolver"],
        toAlbum: "Abbey Road",
        confidence: "high",
      },
    ]);
  });

  it("removes an artist's entries when no pick exists for them", () => {
    const current: Album[] = [
      { title: "Odds & Sods", artist: "The Who", year: 1974, coverArtUrl: "a" },
    ];
    const picks: DefinitiveAlbumPick[] = [];

    expect(diffDefinitiveAlbums(current, picks)).toEqual([
      { type: "remove", artist: "The Who", fromAlbums: ["Odds & Sods"] },
    ]);
  });

  it("handles multiple artists independently: no-op, add, and remove together", () => {
    const current: Album[] = [
      { title: "Blue Rev", artist: "Alvvays", year: 2022, coverArtUrl: "a" },
      { title: "Odds & Sods", artist: "The Who", year: 1974, coverArtUrl: "b" },
    ];
    const picks: DefinitiveAlbumPick[] = [
      { artist: "Alvvays", album: "Blue Rev", confidence: "high" },
      { artist: "The Beatles", album: "Abbey Road", confidence: "low" },
    ];

    expect(diffDefinitiveAlbums(current, picks)).toEqual([
      { type: "add", artist: "The Beatles", toAlbum: "Abbey Road", confidence: "low" },
      { type: "remove", artist: "The Who", fromAlbums: ["Odds & Sods"] },
    ]);
  });
});
