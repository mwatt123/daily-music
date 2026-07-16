import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { albums } from "../src/albums";
import type { AlbumChange } from "./diffDefinitiveAlbums";
import { fetchCoverArt } from "./fetchCoverArt";
import { applyReviewDecisions, type CoverArt, type ReviewDecisionRecord } from "./applyReviewDecisions";
import { serializeAlbums } from "./serializeAlbums";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const REQUEST_PACING_MS = 1500;

const decisionsPath = process.argv[2];
if (!decisionsPath) {
  console.error("Usage: npm run curate:apply-review -- <path-to-decisions.json>");
  process.exit(1);
}

const reviewReportPath = fileURLToPath(new URL("../review-report.json", import.meta.url));
const reviewItems: AlbumChange[] = JSON.parse(readFileSync(reviewReportPath, "utf-8"));
const decisions: ReviewDecisionRecord[] = JSON.parse(readFileSync(decisionsPath, "utf-8")).map(
  (d: { idx: number; decision: string; finalAlbum: string | null }) => ({
    idx: d.idx,
    decision: d.decision,
    finalAlbum: d.finalAlbum,
  }),
);

const needsCoverArt = decisions.filter((d) => d.decision === "approve" || d.decision === "correct");
const coverArtByIdx = new Map<number, CoverArt>();

for (const [index, decision] of needsCoverArt.entries()) {
  if (index > 0) await sleep(REQUEST_PACING_MS);

  const item = reviewItems[decision.idx];
  const coverArt = await fetchCoverArt({ artist: item.artist, album: decision.finalAlbum as string });
  if (coverArt) {
    coverArtByIdx.set(decision.idx, { coverArtUrl: coverArt.coverArtUrl, year: coverArt.year });
  }

  if ((index + 1) % 25 === 0) {
    console.log(`Fetched ${index + 1}/${needsCoverArt.length}...`);
  }
}

const result = applyReviewDecisions(albums, reviewItems, decisions, coverArtByIdx);

const albumsFilePath = fileURLToPath(new URL("../src/albums.ts", import.meta.url));
const currentFileText = readFileSync(albumsFilePath, "utf-8");
const marker = "export const albums: Album[] = ";
const markerIndex = currentFileText.indexOf(marker);
if (markerIndex === -1) {
  throw new Error(`Could not find "${marker}" in ${albumsFilePath}`);
}

const prefix = currentFileText.slice(0, markerIndex + marker.length);
writeFileSync(albumsFilePath, prefix + serializeAlbums(result.albums));

writeFileSync(reviewReportPath, JSON.stringify(result.skipped, null, 2));

const counts = { approve: 0, correct: 0, reject: 0, keepone: 0 };
for (const d of decisions) counts[d.decision as keyof typeof counts]++;

console.log(`Decisions: ${counts.approve} approved, ${counts.correct} corrected, ${counts.keepone} kept-one, ${counts.reject} rejected.`);
console.log(`Cover art still unresolved for ${result.skipped.length} approved/corrected item(s) — written to ${reviewReportPath}.`);
console.log(`src/albums.ts now has ${result.albums.length} albums.`);
