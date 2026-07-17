import type { Album } from "../src/albums";

function serializeAlbum(album: Album): string {
  const lines = [
    "  {",
    `    title: ${JSON.stringify(album.title)},`,
    `    artist: ${JSON.stringify(album.artist)},`,
    `    year: ${album.year},`,
    `    coverArtUrl: ${JSON.stringify(album.coverArtUrl)},`,
  ];
  // Only emit the optional Listen link when resolved, so albums without one still
  // serialize byte-identically and a curation regen never strips a backfilled URL.
  if (album.listenUrl !== undefined) {
    lines.push(`    listenUrl: ${JSON.stringify(album.listenUrl)},`);
  }
  lines.push("  },");
  return lines.join("\n");
}

export function serializeAlbums(albums: Album[]): string {
  return `[\n${albums.map(serializeAlbum).join("\n")}\n];\n`;
}
