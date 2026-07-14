import { describe, it, expect } from "vitest";
import { selectDailyAlbum } from "./dailyAlbum";
import type { Album } from "./albums";

const albums: Album[] = [
  { title: "In Rainbows", artist: "Radiohead", year: 2007, coverArtUrl: "a" },
  { title: "Rumours", artist: "Fleetwood Mac", year: 1977, coverArtUrl: "b" },
  { title: "To Pimp a Butterfly", artist: "Kendrick Lamar", year: 2015, coverArtUrl: "c" },
];

describe("selectDailyAlbum", () => {
  it("returns the same album for the same visitor and date on repeated calls", () => {
    const first = selectDailyAlbum("visitor-1", "2026-07-14", albums);
    const second = selectDailyAlbum("visitor-1", "2026-07-14", albums);

    expect(second).toEqual(first);
  });

  it("spreads different visitors across different albums on the same date", () => {
    const visitorIds = Array.from({ length: 20 }, (_, i) => `visitor-${i}`);
    const picks = visitorIds.map((id) => selectDailyAlbum(id, "2026-07-14", albums));
    const distinctTitles = new Set(picks.map((album) => album.title));

    expect(distinctTitles.size).toBeGreaterThan(1);
  });

  it("spreads a single visitor across different albums on different dates", () => {
    const dates = Array.from({ length: 20 }, (_, i) => `2026-07-${String(i + 1).padStart(2, "0")}`);
    const picks = dates.map((date) => selectDailyAlbum("visitor-1", date, albums));
    const distinctTitles = new Set(picks.map((album) => album.title));

    expect(distinctTitles.size).toBeGreaterThan(1);
  });

  it("always returns the only album when the list has exactly one entry", () => {
    const single: Album[] = [albums[0]];

    expect(selectDailyAlbum("visitor-1", "2026-07-14", single)).toEqual(albums[0]);
    expect(selectDailyAlbum("visitor-2", "2026-08-01", single)).toEqual(albums[0]);
  });

  it("returns a valid album rather than throwing when the visitor id is an empty string", () => {
    const result = selectDailyAlbum("", "2026-07-14", albums);

    expect(albums).toContainEqual(result);
  });
});