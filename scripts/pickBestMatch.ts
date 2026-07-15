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

function isConfidentMatch(result: ITunesSearchResult, { artist, album }: AlbumKey): boolean {
  return (
    result.wrapperType === "collection" &&
    result.collectionType === "Album" &&
    normalize(result.artistName) === normalize(artist) &&
    normalize(result.collectionName) === normalize(album)
  );
}

export function pickBestMatch(results: ITunesSearchResult[], key: AlbumKey): CoverArtMatch | null {
  const match = results.find((result) => isConfidentMatch(result, key));
  if (!match) return null;

  return {
    coverArtUrl: match.artworkUrl100.replace("100x100bb", "600x600bb"),
    year: new Date(match.releaseDate).getFullYear(),
  };
}
