import type { Album } from "../src/albums";
import type { CoverArt } from "./applyReviewDecisions";

function key(artist: string, title: string): string {
  return `${artist}|||${title}`;
}

export function refreshCoverArt(currentAlbums: Album[], coverArtByKey: Map<string, CoverArt>): Album[] {
  return currentAlbums.map((album) => {
    const fresh = coverArtByKey.get(key(album.artist, album.title));
    if (!fresh) return album;
    return { ...album, year: fresh.year, coverArtUrl: fresh.coverArtUrl };
  });
}
