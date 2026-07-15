import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { albums } from "../src/albums";
import { albumOverrides } from "./albumOverrides";
import { selectDefinitiveAlbums, type ClassifiedAlbumRow } from "./selectDefinitiveAlbums";
import { diffDefinitiveAlbums, type AlbumChange } from "./diffDefinitiveAlbums";
import { fetchCoverArt } from "./fetchCoverArt";
import { applyVerifiedChanges, type VerifiedChange } from "./applyVerifiedChanges";
import { serializeAlbums } from "./serializeAlbums";

function isAddOrReplace(change: AlbumChange): change is Extract<AlbumChange, { type: "add" | "replace" }> {
  return change.type !== "remove";
}

const classifiedRowsPath = process.argv[2];
if (!classifiedRowsPath) {
  console.error("Usage: npm run curate:apply -- <path-to-classified-rows.json>");
  process.exit(1);
}

const rows: ClassifiedAlbumRow[] = JSON.parse(readFileSync(classifiedRowsPath, "utf-8"));
const picks = selectDefinitiveAlbums(rows, albumOverrides);
const changes = diffDefinitiveAlbums(albums, picks);

const reviewReport: Array<AlbumChange & { reason: string }> = changes
  .filter((change) => change.type === "remove")
  .map((change) => ({ ...change, reason: "removal always requires manual review" }));

const verified: VerifiedChange[] = [];

for (const change of changes.filter(isAddOrReplace)) {
  const coverArt = await fetchCoverArt({ artist: change.artist, album: change.toAlbum });
  if (!coverArt) {
    reviewReport.push({ ...change, reason: "no confident cover art match found" });
    continue;
  }

  if (change.confidence === "low") {
    reviewReport.push({ ...change, reason: "low confidence pick" });
    continue;
  }

  verified.push({ ...change, coverArtUrl: coverArt.coverArtUrl, year: coverArt.year });
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
writeFileSync(reviewReportPath, JSON.stringify(reviewReport, null, 2));

console.log(`Applied ${verified.length} change(s) to src/albums.ts.`);
console.log(`Wrote ${reviewReport.length} item(s) needing manual review to ${reviewReportPath}.`);
