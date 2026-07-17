import type { ITunesSearchResult } from "./pickBestMatch";

/**
 * The clean Apple Music album URL to bake into an album as its `listenUrl`, or
 * null if the matched result carries none. Strips iTunes' `?uo=` tracking query
 * so the stored link is a stable, pure static URL to the exact album.
 */
export function listenUrlFromResult(result: ITunesSearchResult): string | null {
  if (!result.collectionViewUrl) return null;
  try {
    const url = new URL(result.collectionViewUrl);
    url.search = "";
    return url.toString();
  } catch {
    return null;
  }
}
