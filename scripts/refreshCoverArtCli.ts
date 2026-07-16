import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { albums } from "../src/albums";
import { fetchCoverArt } from "./fetchCoverArt";
import { refreshCoverArt } from "./refreshCoverArt";
import { type CoverArt } from "./applyReviewDecisions";
import { serializeAlbums } from "./serializeAlbums";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const REQUEST_PACING_MS = 1500;

const decisionsPath = process.argv[2];
if (!decisionsPath) {
  console.error("Usage: npm run curate:refresh-covers -- <path-to-final-review-decisions.json>");
  process.exit(1);
}

interface FinalReviewDecision {
  artist: string;
  title: string;
  removed: boolean;
  wrongCover: boolean;
}

const decisions: FinalReviewDecision[] = JSON.parse(readFileSync(decisionsPath, "utf-8"));
const targets = decisions.filter((d) => d.wrongCover && !d.removed);

const coverArtByKey = new Map<string, CoverArt>();
const stillWrong: FinalReviewDecision[] = [];

for (const [index, target] of targets.entries()) {
  if (index > 0) await sleep(REQUEST_PACING_MS);

  const coverArt = await fetchCoverArt({ artist: target.artist, album: target.title });
  if (coverArt) {
    coverArtByKey.set(`${target.artist}|||${target.title}`, { coverArtUrl: coverArt.coverArtUrl, year: coverArt.year });
  } else {
    stillWrong.push(target);
  }
}

const updatedAlbums = refreshCoverArt(albums, coverArtByKey);

const albumsFilePath = fileURLToPath(new URL("../src/albums.ts", import.meta.url));
const currentFileText = readFileSync(albumsFilePath, "utf-8");
const marker = "export const albums: Album[] = ";
const markerIndex = currentFileText.indexOf(marker);
if (markerIndex === -1) {
  throw new Error(`Could not find "${marker}" in ${albumsFilePath}`);
}

const prefix = currentFileText.slice(0, markerIndex + marker.length);
writeFileSync(albumsFilePath, prefix + serializeAlbums(updatedAlbums));

const stillWrongPath = fileURLToPath(new URL("../still-wrong-covers.json", import.meta.url));
writeFileSync(stillWrongPath, JSON.stringify(stillWrong, null, 2));

console.log(`Fixed ${coverArtByKey.size}/${targets.length} cover(s).`);
console.log(`${stillWrong.length} still wrong -- written to ${stillWrongPath}.`);
