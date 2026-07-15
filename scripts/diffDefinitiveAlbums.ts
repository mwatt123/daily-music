import type { Album } from "../src/albums";
import type { Confidence, DefinitiveAlbumPick } from "./selectDefinitiveAlbums";

export type AlbumChange =
  | { type: "add"; artist: string; toAlbum: string; confidence: Confidence }
  | { type: "replace"; artist: string; fromAlbums: string[]; toAlbum: string; confidence: Confidence }
  | { type: "remove"; artist: string; fromAlbums: string[] };

function groupTitlesByArtist(albums: Album[]): Map<string, string[]> {
  const byArtist = new Map<string, string[]>();
  for (const { artist, title } of albums) {
    const existing = byArtist.get(artist);
    if (existing) existing.push(title);
    else byArtist.set(artist, [title]);
  }
  return byArtist;
}

export function diffDefinitiveAlbums(currentAlbums: Album[], picks: DefinitiveAlbumPick[]): AlbumChange[] {
  const currentByArtist = groupTitlesByArtist(currentAlbums);
  const pickedArtists = new Set(picks.map((pick) => pick.artist));
  const changes: AlbumChange[] = [];

  for (const pick of picks) {
    const currentTitles = currentByArtist.get(pick.artist) ?? [];
    const alreadyCorrect = currentTitles.length === 1 && currentTitles[0] === pick.album;
    if (alreadyCorrect) continue;

    if (currentTitles.length === 0) {
      changes.push({ type: "add", artist: pick.artist, toAlbum: pick.album, confidence: pick.confidence });
    } else {
      changes.push({
        type: "replace",
        artist: pick.artist,
        fromAlbums: currentTitles,
        toAlbum: pick.album,
        confidence: pick.confidence,
      });
    }
  }

  for (const [artist, titles] of currentByArtist) {
    if (!pickedArtists.has(artist)) {
      changes.push({ type: "remove", artist, fromAlbums: titles });
    }
  }

  return changes;
}
