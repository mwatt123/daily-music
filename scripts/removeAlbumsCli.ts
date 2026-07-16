import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { albums } from "../src/albums";
import { removeAlbums, type AlbumIdentifier } from "./removeAlbums";
import { serializeAlbums } from "./serializeAlbums";

const decisionsPath = process.argv[2];
if (!decisionsPath) {
  console.error("Usage: npm run curate:remove -- <path-to-final-review-decisions.json>");
  process.exit(1);
}

interface FinalReviewDecision extends AlbumIdentifier {
  removed: boolean;
  wrongCover: boolean;
}

const decisions: FinalReviewDecision[] = JSON.parse(readFileSync(decisionsPath, "utf-8"));
const toRemove = decisions.filter((d) => d.removed);

const updatedAlbums = removeAlbums(albums, toRemove);

const albumsFilePath = fileURLToPath(new URL("../src/albums.ts", import.meta.url));
const currentFileText = readFileSync(albumsFilePath, "utf-8");
const marker = "export const albums: Album[] = ";
const markerIndex = currentFileText.indexOf(marker);
if (markerIndex === -1) {
  throw new Error(`Could not find "${marker}" in ${albumsFilePath}`);
}

const prefix = currentFileText.slice(0, markerIndex + marker.length);
writeFileSync(albumsFilePath, prefix + serializeAlbums(updatedAlbums));

console.log(`Removed ${albums.length - updatedAlbums.length} album(s).`);
console.log(`src/albums.ts now has ${updatedAlbums.length} albums.`);
