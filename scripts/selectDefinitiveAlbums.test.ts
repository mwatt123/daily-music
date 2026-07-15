import { describe, expect, it } from "vitest";
import {
  selectDefinitiveAlbums,
  type ClassifiedAlbumRow,
} from "./selectDefinitiveAlbums";
import type { AlbumOverride } from "./albumOverrides";

describe("selectDefinitiveAlbums", () => {
  it("picks a single studio candidate with high confidence", () => {
    const rows: ClassifiedAlbumRow[] = [
      { artist: "The Beatles", album: "Abbey Road", averagePlayCount: 26, classification: "studio" },
    ];
    const overrides: AlbumOverride[] = [];

    expect(selectDefinitiveAlbums(rows, overrides)).toEqual([
      { artist: "The Beatles", album: "Abbey Road", confidence: "high" },
    ]);
  });

  it("picks the highest-Preference-Signal studio candidate when there's a clear winner", () => {
    const rows: ClassifiedAlbumRow[] = [
      { artist: "The Beatles", album: "Let It Be", averagePlayCount: 5, classification: "studio" },
      { artist: "The Beatles", album: "Abbey Road", averagePlayCount: 26, classification: "studio" },
    ];
    const overrides: AlbumOverride[] = [];

    expect(selectDefinitiveAlbums(rows, overrides)).toEqual([
      { artist: "The Beatles", album: "Abbey Road", confidence: "high" },
    ]);
  });

  it("flags a near-tied top two candidates as low confidence", () => {
    const rows: ClassifiedAlbumRow[] = [
      { artist: "The Beatles", album: "Revolver", averagePlayCount: 90, classification: "studio" },
      { artist: "The Beatles", album: "Abbey Road", averagePlayCount: 100, classification: "studio" },
    ];
    const overrides: AlbumOverride[] = [];

    expect(selectDefinitiveAlbums(rows, overrides)).toEqual([
      { artist: "The Beatles", album: "Abbey Road", confidence: "low" },
    ]);
  });

  it("lets an override win over a higher-Preference-Signal candidate", () => {
    const rows: ClassifiedAlbumRow[] = [
      { artist: "The Beatles", album: "Let It Be", averagePlayCount: 5, classification: "studio" },
      { artist: "The Beatles", album: "Abbey Road", averagePlayCount: 26, classification: "studio" },
    ];
    const overrides: AlbumOverride[] = [{ artist: "The Beatles", album: "Let It Be" }];

    expect(selectDefinitiveAlbums(rows, overrides)).toEqual([
      { artist: "The Beatles", album: "Let It Be", confidence: "high" },
    ]);
  });

  it("treats a reissue as an eligible candidate when no studio pressing exists", () => {
    const rows: ClassifiedAlbumRow[] = [
      {
        artist: "Fleetwood Mac",
        album: "Rumours (Remastered)",
        averagePlayCount: 40,
        classification: "reissue",
      },
    ];
    const overrides: AlbumOverride[] = [];

    expect(selectDefinitiveAlbums(rows, overrides)).toEqual([
      { artist: "Fleetwood Mac", album: "Rumours (Remastered)", confidence: "high" },
    ]);
  });

  it("ranks studio and reissue candidates for the same artist together", () => {
    const rows: ClassifiedAlbumRow[] = [
      {
        artist: "Fleetwood Mac",
        album: "Rumours",
        averagePlayCount: 20,
        classification: "studio",
      },
      {
        artist: "Fleetwood Mac",
        album: "Rumours (Remastered)",
        averagePlayCount: 40,
        classification: "reissue",
      },
    ];
    const overrides: AlbumOverride[] = [];

    expect(selectDefinitiveAlbums(rows, overrides)).toEqual([
      { artist: "Fleetwood Mac", album: "Rumours (Remastered)", confidence: "high" },
    ]);
  });

  it("produces no pick for an artist with no studio or reissue candidates", () => {
    const rows: ClassifiedAlbumRow[] = [
      { artist: "Various", album: "Live at Wembley", averagePlayCount: 12, classification: "live" },
      { artist: "Various", album: "Greatest Hits", averagePlayCount: 50, classification: "compilation" },
    ];
    const overrides: AlbumOverride[] = [];

    expect(selectDefinitiveAlbums(rows, overrides)).toEqual([]);
  });

  it("handles multiple artists independently", () => {
    const rows: ClassifiedAlbumRow[] = [
      { artist: "The Beatles", album: "Abbey Road", averagePlayCount: 26, classification: "studio" },
      { artist: "Alvvays", album: "Blue Rev", averagePlayCount: 10, classification: "studio" },
    ];
    const overrides: AlbumOverride[] = [];

    expect(selectDefinitiveAlbums(rows, overrides)).toEqual([
      { artist: "The Beatles", album: "Abbey Road", confidence: "high" },
      { artist: "Alvvays", album: "Blue Rev", confidence: "high" },
    ]);
  });
});
