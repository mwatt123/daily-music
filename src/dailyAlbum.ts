import type { Album } from "./albums";

/** FNV-1a, 32-bit. Small and dependency-free; not cryptographic. */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Visitor's local calendar date as YYYY-MM-DD, so the pick rolls over at local midnight. */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function selectDailyAlbum(
  visitorId: string,
  date: string,
  albums: Album[],
): Album {
  const seed = `${visitorId}-${date}`;
  const index = fnv1a(seed) % albums.length;
  return albums[index];
}