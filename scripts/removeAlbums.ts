import type { Album } from "../src/albums";

export interface AlbumIdentifier {
  artist: string;
  title: string;
}

function key(a: AlbumIdentifier): string {
  return `${a.artist}|||${a.title}`;
}

export function removeAlbums(currentAlbums: Album[], toRemove: AlbumIdentifier[]): Album[] {
  const removeSet = new Set(toRemove.map(key));
  return currentAlbums.filter((album) => !removeSet.has(key(album)));
}
