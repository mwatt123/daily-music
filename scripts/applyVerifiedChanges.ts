import type { Album } from "../src/albums";

export type VerifiedChange =
  | { type: "add"; artist: string; toAlbum: string; coverArtUrl: string; year: number }
  | { type: "replace"; artist: string; fromAlbums: string[]; toAlbum: string; coverArtUrl: string; year: number };

function isRemovedByReplace(album: Album, change: VerifiedChange): boolean {
  return change.type === "replace" && change.artist === album.artist && change.fromAlbums.includes(album.title);
}

export function applyVerifiedChanges(currentAlbums: Album[], changes: VerifiedChange[]): Album[] {
  const survivors = currentAlbums.filter(
    (album) => !changes.some((change) => isRemovedByReplace(album, change)),
  );

  const added = changes.map(
    (change): Album => ({
      title: change.toAlbum,
      artist: change.artist,
      year: change.year,
      coverArtUrl: change.coverArtUrl,
    }),
  );

  return [...survivors, ...added];
}
