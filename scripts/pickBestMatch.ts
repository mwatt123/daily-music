import type { AlbumKey } from "./playCountExtraction";

export interface ITunesSearchResult {
  wrapperType: string;
  collectionType?: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  releaseDate: string;
}

export interface CoverArtMatch {
  coverArtUrl: string;
  year: number;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function isAlbumByArtist(result: ITunesSearchResult, artist: string): boolean {
  return (
    result.wrapperType === "collection" &&
    result.collectionType === "Album" &&
    normalize(result.artistName) === normalize(artist)
  );
}

function isExactMatch(result: ITunesSearchResult, { artist, album }: AlbumKey): boolean {
  return isAlbumByArtist(result, artist) && normalize(result.collectionName) === normalize(album);
}

/** Many classic albums are no longer sold under their plain title -- iTunes
 * lists only a remastered/anniversary edition instead. Accept a title that's
 * the target plus a parenthetical suffix (e.g. "In Utero (20th Anniversary
 * Edition)"), but not a suffix that suggests a single or other decoy. */
function isEditionMatch(result: ITunesSearchResult, { artist, album }: AlbumKey): boolean {
  if (!isAlbumByArtist(result, artist)) return false;

  const name = normalize(result.collectionName);
  const prefix = `${normalize(album)} (`;
  if (!name.startsWith(prefix) || !name.endsWith(")")) return false;

  const suffix = name.slice(prefix.length, -1);
  return !suffix.includes("single");
}

export function pickBestMatch(results: ITunesSearchResult[], key: AlbumKey): CoverArtMatch | null {
  const match =
    results.find((result) => isExactMatch(result, key)) ?? results.find((result) => isEditionMatch(result, key));
  if (!match) return null;

  return {
    coverArtUrl: match.artworkUrl100.replace("100x100bb", "600x600bb"),
    year: new Date(match.releaseDate).getFullYear(),
  };
}
