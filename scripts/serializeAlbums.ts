import type { Album } from "../src/albums";

function serializeAlbum(album: Album): string {
  return [
    "  {",
    `    title: ${JSON.stringify(album.title)},`,
    `    artist: ${JSON.stringify(album.artist)},`,
    `    year: ${album.year},`,
    `    coverArtUrl: ${JSON.stringify(album.coverArtUrl)},`,
    "  },",
  ].join("\n");
}

export function serializeAlbums(albums: Album[]): string {
  return `[\n${albums.map(serializeAlbum).join("\n")}\n];\n`;
}
