import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { albums } from "../src/albums";
import { fetchCoverArt } from "./fetchCoverArt";
import { applyVerifiedChanges, type VerifiedChange } from "./applyVerifiedChanges";
import { serializeAlbums } from "./serializeAlbums";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const REQUEST_PACING_MS = 1500;

const decisionsPath = process.argv[2];
if (!decisionsPath) {
  console.error("Usage: npm run curate:retry-review -- <path-to-decisions.json>");
  process.exit(1);
}

interface SkippedDecision {
  idx: number;
  artist: string;
  finalAlbum: string;
  reason: string;
}

const reviewReportPath = fileURLToPath(new URL("../review-report.json", import.meta.url));
const unresolved: SkippedDecision[] = JSON.parse(readFileSync(reviewReportPath, "utf-8"));

const decisionTypeByIdx = new Map<number, string>(
  JSON.parse(readFileSync(decisionsPath, "utf-8")).map((d: { idx: number; type: string }) => [d.idx, d.type]),
);

const verified: VerifiedChange[] = [];
const stillUnresolved: SkippedDecision[] = [];

for (const [index, item] of unresolved.entries()) {
  if (index > 0) await sleep(REQUEST_PACING_MS);

  const coverArt = await fetchCoverArt({ artist: item.artist, album: item.finalAlbum });
  if (!coverArt) {
    stillUnresolved.push(item);
    continue;
  }

  const type = decisionTypeByIdx.get(item.idx);
  if (type === "replace") {
    const fromAlbums = albums.filter((a) => a.artist === item.artist).map((a) => a.title);
    verified.push({
      type: "replace",
      artist: item.artist,
      fromAlbums,
      toAlbum: item.finalAlbum,
      coverArtUrl: coverArt.coverArtUrl,
      year: coverArt.year,
    });
  } else {
    verified.push({ type: "add", artist: item.artist, toAlbum: item.finalAlbum, coverArtUrl: coverArt.coverArtUrl, year: coverArt.year });
  }

  if ((index + 1) % 25 === 0) {
    console.log(`Retried ${index + 1}/${unresolved.length}...`);
  }
}

const updatedAlbums = applyVerifiedChanges(albums, verified);

const albumsFilePath = fileURLToPath(new URL("../src/albums.ts", import.meta.url));
const currentFileText = readFileSync(albumsFilePath, "utf-8");
const marker = "export const albums: Album[] = ";
const markerIndex = currentFileText.indexOf(marker);
if (markerIndex === -1) {
  throw new Error(`Could not find "${marker}" in ${albumsFilePath}`);
}

const prefix = currentFileText.slice(0, markerIndex + marker.length);
writeFileSync(albumsFilePath, prefix + serializeAlbums(updatedAlbums));

writeFileSync(reviewReportPath, JSON.stringify(stillUnresolved, null, 2));

console.log(`Recovered ${verified.length}/${unresolved.length} via the edition-suffix fallback.`);
console.log(`${stillUnresolved.length} item(s) still unresolved -- written to ${reviewReportPath}.`);
console.log(`src/albums.ts now has ${updatedAlbums.length} albums.`);
