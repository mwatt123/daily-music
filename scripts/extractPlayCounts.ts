import { readFileSync } from "node:fs";
import { extractAlbumPlayCounts } from "./playCountExtraction";

const libraryPath = process.argv[2];
if (!libraryPath) {
  console.error("Usage: npm run curate:extract -- <path-to-Library.xml>");
  process.exit(1);
}

const xml = readFileSync(libraryPath, "utf-8");
const rows = extractAlbumPlayCounts(xml);
console.log(JSON.stringify(rows, null, 2));
