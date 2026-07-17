import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { albums } from "../src/albums";
import type { Album } from "../src/albums";
import { pickBestResult, type ITunesSearchResult } from "./pickBestMatch";
import { listenUrlFromResult } from "./resolveListenUrls";
import { serializeAlbums } from "./serializeAlbums";

// Backfills each album's `listenUrl` with the exact Apple Music album URL from
// the iTunes Search API (same matching as cover-art curation). Resumable: albums
// that already have a listenUrl are skipped unless `--all` is passed, and the
// file is checkpointed periodically so a long, rate-limited run is never lost.
// The app degrades to a search URL for any album this can't resolve.

const REQUEST_PACING_MS = 700;
const CHECKPOINT_EVERY = 25;
const resolveAll = process.argv.includes("--all");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** iTunes' undocumented rate limit returns a non-JSON body rather than a clean
 * error status, so retry with backoff -- transient, not a real "no match". */
async function fetchSearchResults(url: string, attempts = 5): Promise<ITunesSearchResult[] | null> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await sleep(5000 * 2 ** (attempt - 1));
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = (await response.json().catch(() => null)) as { results: ITunesSearchResult[] } | null;
      if (data) return data.results;
    } catch {
      // Network-level error (e.g. ECONNRESET when the connection is dropped) --
      // transient, so fall through to the backoff and retry rather than crash.
    }
  }
  return null;
}

async function resolveListenUrl(album: Album): Promise<string | null> {
  const term = encodeURIComponent(`${album.artist} ${album.title}`);
  const url = `https://itunes.apple.com/search?term=${term}&entity=album&limit=25`;
  const results = await fetchSearchResults(url);
  if (!results) return null;
  const match = pickBestResult(results, { artist: album.artist, album: album.title });
  return match ? listenUrlFromResult(match) : null;
}

const albumsFilePath = fileURLToPath(new URL("../src/albums.ts", import.meta.url));
const marker = "export const albums: Album[] = ";

function writeBack(next: Album[]): void {
  const currentFileText = readFileSync(albumsFilePath, "utf-8");
  const markerIndex = currentFileText.indexOf(marker);
  if (markerIndex === -1) throw new Error(`Could not find "${marker}" in ${albumsFilePath}`);
  const prefix = currentFileText.slice(0, markerIndex + marker.length);
  writeFileSync(albumsFilePath, prefix + serializeAlbums(next));
}

const next: Album[] = albums.map((a) => ({ ...a }));
const targets = next.filter((a) => resolveAll || a.listenUrl === undefined);
console.log(`Resolving listen URLs for ${targets.length}/${next.length} album(s)...`);

let resolved = 0;
let sinceCheckpoint = 0;
const unresolved: Array<{ artist: string; title: string }> = [];

for (const [index, album] of targets.entries()) {
  if (index > 0) await sleep(REQUEST_PACING_MS);
  const listenUrl = await resolveListenUrl(album);
  if (listenUrl) {
    album.listenUrl = listenUrl;
    resolved++;
    sinceCheckpoint++;
  } else {
    unresolved.push({ artist: album.artist, title: album.title });
  }

  if (sinceCheckpoint >= CHECKPOINT_EVERY) {
    writeBack(next);
    sinceCheckpoint = 0;
    console.log(`  checkpoint: ${resolved} resolved so far (${index + 1}/${targets.length} processed)`);
  }
}

writeBack(next);

const unresolvedPath = fileURLToPath(new URL("../unresolved-listen-urls.json", import.meta.url));
writeFileSync(unresolvedPath, JSON.stringify(unresolved, null, 2));

console.log(`Done. Resolved ${resolved}/${targets.length}; ${unresolved.length} fall back to a search URL.`);
console.log(`Unresolved list written to ${unresolvedPath}.`);
