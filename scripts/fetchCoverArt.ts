import type { AlbumKey } from "./playCountExtraction";
import { pickBestMatch, type CoverArtMatch, type ITunesSearchResult } from "./pickBestMatch";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** iTunes Search API has an undocumented rate limit that returns a
 * non-JSON body rather than a clean error status; retry with backoff
 * since this is transient, not a real "no match". */
async function fetchSearchResults(url: string, attempts = 4): Promise<{ results: ITunesSearchResult[] } | null> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await sleep(5000 * 2 ** (attempt - 1));

    const response = await fetch(url);
    if (!response.ok) continue;

    const data = await response.json().catch(() => null);
    if (data) return data as { results: ITunesSearchResult[] };
  }
  return null;
}

export async function fetchCoverArt(key: AlbumKey): Promise<CoverArtMatch | null> {
  const term = encodeURIComponent(`${key.artist} ${key.album}`);
  const url = `https://itunes.apple.com/search?term=${term}&entity=album&limit=25`;

  const data = await fetchSearchResults(url);
  if (!data) return null;

  return pickBestMatch(data.results, key);
}
