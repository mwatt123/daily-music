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

const additionsPath = process.argv[2];
if (!additionsPath) {
  console.error("Usage: npm run curate:add -- <path-to-additions.json>");
  process.exit(1);
}

interface Addition {
  artist: string;
  album: string;
}

const additions: Addition[] = JSON.parse(readFileSync(additionsPath, "utf-8"));

const verified: VerifiedChange[] = [];
const notFound: Addition[] = [];

for (const [index, addition] of additions.entries()) {
  if (index > 0) await sleep(REQUEST_PACING_MS);

  const coverArt = await fetchCoverArt({ artist: addition.artist, album: addition.album });
  if (coverArt) {
    verified.push({ type: "add", artist: addition.artist, toAlbum: addition.album, coverArtUrl: coverArt.coverArtUrl, year: coverArt.year });
  } else {
    notFound.push(addition);
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

console.log(`Added ${verified.length}/${additions.length} album(s).`);
if (notFound.length > 0) {
  console.log(`Not found on iTunes: ${notFound.map((a) => `${a.artist} - ${a.album}`).join(", ")}`);
}
console.log(`src/albums.ts now has ${updatedAlbums.length} albums.`);
