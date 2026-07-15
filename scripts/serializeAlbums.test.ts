import { describe, expect, it } from "vitest";
import { serializeAlbums } from "./serializeAlbums";
import type { Album } from "../src/albums";

describe("serializeAlbums", () => {
  it("renders a single album matching the existing albums.ts formatting", () => {
    const albums: Album[] = [
      { title: "Rocket", artist: "Alex G", year: 2001, coverArtUrl: "https://example.com/art.jpg" },
    ];

    expect(serializeAlbums(albums)).toBe(
      `[
  {
    title: "Rocket",
    artist: "Alex G",
    year: 2001,
    coverArtUrl: "https://example.com/art.jpg",
  },
];
`,
    );
  });

  it("renders multiple albums in order, joined with a newline between entries", () => {
    const albums: Album[] = [
      { title: "Rocket", artist: "Alex G", year: 2001, coverArtUrl: "a" },
      { title: "Blue Rev", artist: "Alvvays", year: 2022, coverArtUrl: "b" },
    ];

    expect(serializeAlbums(albums)).toBe(
      `[
  {
    title: "Rocket",
    artist: "Alex G",
    year: 2001,
    coverArtUrl: "a",
  },
  {
    title: "Blue Rev",
    artist: "Alvvays",
    year: 2022,
    coverArtUrl: "b",
  },
];
`,
    );
  });

  it("escapes double quotes within a title", () => {
    const albums: Album[] = [
      { title: 'Songs of "Love"', artist: "Someone", year: 2000, coverArtUrl: "a" },
    ];

    expect(serializeAlbums(albums)).toBe(
      `[
  {
    title: "Songs of \\"Love\\"",
    artist: "Someone",
    year: 2000,
    coverArtUrl: "a",
  },
];
`,
    );
  });
});
