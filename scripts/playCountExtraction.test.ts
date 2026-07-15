import { describe, expect, it } from "vitest";
import { extractAlbumPlayCounts } from "./playCountExtraction";

/** Builds a minimal Library.xml fixture with a Tracks dict followed by a
 * trailing Playlists key, matching the real export's shape. */
function libraryXml(tracks: Record<string, string | number>[]): string {
  const trackEntries = tracks
    .map((fields, i) => {
      const body = Object.entries(fields)
        .map(([key, value]) => {
          const type = typeof value === "number" ? "integer" : "string";
          return `<key>${key}</key><${type}>${value}</${type}>`;
        })
        .join("");
      return `<key>${i + 1}</key><dict>${body}</dict>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
	<key>Major Version</key><integer>1</integer>
	<key>Tracks</key>
	<dict>${trackEntries}</dict>
	<key>Playlists</key>
	<array></array>
</dict>
</plist>`;
}

describe("extractAlbumPlayCounts", () => {
  it("returns a single row for a single track", () => {
    const xml = libraryXml([
      { Artist: "The Beatles", Album: "Abbey Road", "Play Count": 42 },
    ]);

    expect(extractAlbumPlayCounts(xml)).toEqual([
      { artist: "The Beatles", album: "Abbey Road", averagePlayCount: 42 },
    ]);
  });

  it("averages play counts across multiple tracks on the same album", () => {
    const xml = libraryXml([
      { Artist: "The Beatles", Album: "Abbey Road", "Play Count": 42 },
      { Artist: "The Beatles", Album: "Abbey Road", "Play Count": 10 },
    ]);

    expect(extractAlbumPlayCounts(xml)).toEqual([
      { artist: "The Beatles", album: "Abbey Road", averagePlayCount: 26 },
    ]);
  });

  it("keeps near-duplicate album titles as separate rows (exact match only)", () => {
    const xml = libraryXml([
      { Artist: "The Beatles", Album: "Abbey Road", "Play Count": 42 },
      {
        Artist: "The Beatles",
        Album: "Abbey Road (Remastered)",
        "Play Count": 8,
      },
    ]);

    expect(extractAlbumPlayCounts(xml)).toEqual([
      { artist: "The Beatles", album: "Abbey Road", averagePlayCount: 42 },
      {
        artist: "The Beatles",
        album: "Abbey Road (Remastered)",
        averagePlayCount: 8,
      },
    ]);
  });

  it("treats a track with no Play Count field as zero plays", () => {
    const xml = libraryXml([
      { Artist: "The Beatles", Album: "Abbey Road", "Play Count": 10 },
      { Artist: "The Beatles", Album: "Abbey Road" },
    ]);

    expect(extractAlbumPlayCounts(xml)).toEqual([
      { artist: "The Beatles", album: "Abbey Road", averagePlayCount: 5 },
    ]);
  });

  it("buckets interleaved tracks from different artists correctly", () => {
    const xml = libraryXml([
      { Artist: "The Beatles", Album: "Abbey Road", "Play Count": 42 },
      { Artist: "Alvvays", Album: "Blue Rev", "Play Count": 5 },
      { Artist: "The Beatles", Album: "Abbey Road", "Play Count": 10 },
      { Artist: "Alvvays", Album: "Blue Rev", "Play Count": 15 },
    ]);

    expect(extractAlbumPlayCounts(xml)).toEqual([
      { artist: "The Beatles", album: "Abbey Road", averagePlayCount: 26 },
      { artist: "Alvvays", album: "Blue Rev", averagePlayCount: 10 },
    ]);
  });

  it("decodes XML entities in artist and album names", () => {
    const xml = libraryXml([
      {
        Artist: "Earth, Wind &amp; Fire",
        Album: "Guns N&#39; Roses Tribute",
        "Play Count": 3,
      },
    ]);

    expect(extractAlbumPlayCounts(xml)).toEqual([
      {
        artist: "Earth, Wind & Fire",
        album: "Guns N' Roses Tribute",
        averagePlayCount: 3,
      },
    ]);
  });
});
