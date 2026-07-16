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

const round1DecisionsPath = process.argv[2];
const round2DecisionsPath = process.argv[3];
if (!round1DecisionsPath || !round2DecisionsPath) {
  console.error("Usage: npm run curate:apply-round2 -- <round1-decisions.json> <round2-decisions.json>");
  process.exit(1);
}

interface Round2Decision {
  idx: number;
  decision: "approve" | "reject";
  artist: string;
  finalAlbum: string;
}

const typeByIdx = new Map<number, string>(
  JSON.parse(readFileSync(round1DecisionsPath, "utf-8")).map((d: { idx: number; type: string }) => [d.idx, d.type]),
);
const round2: Round2Decision[] = JSON.parse(readFileSync(round2DecisionsPath, "utf-8"));

const toApprove = round2.filter((d) => d.decision === "approve");
const verified: VerifiedChange[] = [];
const stillUnresolved: Round2Decision[] = [];

for (const [index, item] of toApprove.entries()) {
  if (index > 0) await sleep(REQUEST_PACING_MS);

  const coverArt = await fetchCoverArt({ artist: item.artist, album: item.finalAlbum });
  if (!coverArt) {
    stillUnresolved.push(item);
    continue;
  }

  const type = typeByIdx.get(item.idx);
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
    console.log(`Retried ${index + 1}/${toApprove.length}...`);
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

const reviewReportPath = fileURLToPath(new URL("../review-report.json", import.meta.url));
writeFileSync(reviewReportPath, JSON.stringify(stillUnresolved, null, 2));

console.log(`Approved ${toApprove.length}, applied ${verified.length}, still unresolved ${stillUnresolved.length}.`);
console.log(`src/albums.ts now has ${updatedAlbums.length} albums.`);
