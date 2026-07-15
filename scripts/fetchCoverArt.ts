import type { AlbumKey } from "./playCountExtraction";
import { pickBestMatch, type CoverArtMatch, type ITunesSearchResult } from "./pickBestMatch";

export async function fetchCoverArt(key: AlbumKey): Promise<CoverArtMatch | null> {
  const term = encodeURIComponent(`${key.artist} ${key.album}`);
  const url = `https://itunes.apple.com/search?term=${term}&entity=album&limit=25`;

  const response = await fetch(url);
  const data = (await response.json()) as { results: ITunesSearchResult[] };
  return pickBestMatch(data.results, key);
}
