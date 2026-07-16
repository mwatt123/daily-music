import type { Album } from "../src/albums";
import type { AlbumChange } from "./diffDefinitiveAlbums";
import { applyVerifiedChanges, type VerifiedChange } from "./applyVerifiedChanges";

export type ReviewDecisionRecord =
  | { idx: number; decision: "reject"; finalAlbum: null }
  | { idx: number; decision: "keepone"; finalAlbum: string }
  | { idx: number; decision: "approve" | "correct"; finalAlbum: string };

export interface CoverArt {
  coverArtUrl: string;
  year: number;
}

export interface SkippedDecision {
  idx: number;
  artist: string;
  finalAlbum: string;
  reason: string;
}

export interface ApplyReviewDecisionsResult {
  albums: Album[];
  skipped: SkippedDecision[];
}

function fromAlbumsFor(item: AlbumChange): string[] {
  return item.type === "add" ? [] : item.fromAlbums;
}

export function applyReviewDecisions(
  currentAlbums: Album[],
  reviewItems: AlbumChange[],
  decisions: ReviewDecisionRecord[],
  coverArtByIdx: Map<number, CoverArt>,
): ApplyReviewDecisionsResult {
  const titlesToDrop = new Map<string, Set<string>>();
  const verified: VerifiedChange[] = [];
  const skipped: SkippedDecision[] = [];

  for (const decision of decisions) {
    const item = reviewItems[decision.idx];

    if (decision.decision === "reject") continue;

    if (decision.decision === "keepone") {
      const drop = new Set(fromAlbumsFor(item).filter((title) => title !== decision.finalAlbum));
      const existing = titlesToDrop.get(item.artist);
      if (existing) {
        for (const title of drop) existing.add(title);
      } else {
        titlesToDrop.set(item.artist, drop);
      }
      continue;
    }

    // decision.decision is "approve" | "correct"
    const coverArt = coverArtByIdx.get(decision.idx);
    if (!coverArt) {
      skipped.push({ idx: decision.idx, artist: item.artist, finalAlbum: decision.finalAlbum, reason: "no confident cover art match found" });
      continue;
    }

    if (item.type === "add") {
      verified.push({ type: "add", artist: item.artist, toAlbum: decision.finalAlbum, ...coverArt });
    } else {
      verified.push({
        type: "replace",
        artist: item.artist,
        fromAlbums: item.fromAlbums,
        toAlbum: decision.finalAlbum,
        ...coverArt,
      });
    }
  }

  const afterKeepOne = currentAlbums.filter((album) => {
    const drop = titlesToDrop.get(album.artist);
    return !drop || !drop.has(album.title);
  });

  return { albums: applyVerifiedChanges(afterKeepOne, verified), skipped };
}
