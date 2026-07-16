import { describe, expect, it } from "vitest";
import { removeAlbums } from "./removeAlbums";
import type { Album } from "../src/albums";

describe("removeAlbums", () => {
  it("drops albums matching artist and title", () => {
    const current: Album[] = [
      { title: "Rumours", artist: "Fleetwood Mac", year: 1977, coverArtUrl: "a" },
      { title: "Blue Rev", artist: "Alvvays", year: 2022, coverArtUrl: "b" },
    ];

    expect(removeAlbums(current, [{ artist: "Alvvays", title: "Blue Rev" }])).toEqual([
      { title: "Rumours", artist: "Fleetwood Mac", year: 1977, coverArtUrl: "a" },
    ]);
  });

  it("leaves other albums by the same artist untouched", () => {
    const current: Album[] = [
      { title: "1982", artist: "The Fall", year: 1982, coverArtUrl: "a" },
      { title: "Slates", artist: "The Fall", year: 1981, coverArtUrl: "b" },
    ];

    expect(removeAlbums(current, [{ artist: "The Fall", title: "1982" }])).toEqual([
      { title: "Slates", artist: "The Fall", year: 1981, coverArtUrl: "b" },
    ]);
  });

  it("is a no-op when nothing matches", () => {
    const current: Album[] = [{ title: "Rumours", artist: "Fleetwood Mac", year: 1977, coverArtUrl: "a" }];

    expect(removeAlbums(current, [{ artist: "Someone Else", title: "Some Album" }])).toEqual(current);
  });
});
