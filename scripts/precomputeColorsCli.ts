import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { albums } from "../src/albums";
import { type ExtractedColors } from "../src/dominantColor";
import { extractDominantColorsNode } from "./extractColorsNode";
import { serializeAlbumColors } from "./serializeAlbumColors";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const REQUEST_PACING_MS = 1500;

// De-duplicate by cover url so a shared cover is only fetched/computed once.
const uniqueUrls = [...new Set(albums.map((album) => album.coverArtUrl))];
const titleByUrl = new Map(albums.map((a) => [a.coverArtUrl, `${a.artist} — ${a.title}`]));

const entries: Array<[string, ExtractedColors]> = [];

for (const [index, url] of uniqueUrls.entries()) {
  if (index > 0) await sleep(REQUEST_PACING_MS);

  const colors = await extractDominantColorsNode(url);
  entries.push([url, colors]);
  console.log(
    `${String(index + 1).padStart(3)}/${uniqueUrls.length}  ${colors.primary} / ${colors.secondary}  ${titleByUrl.get(url)}`,
  );
}

const outPath = fileURLToPath(new URL("../src/albumColors.ts", import.meta.url));
writeFileSync(outPath, serializeAlbumColors(entries));

console.log(`\nWrote ${entries.length} color entries to src/albumColors.ts`);
