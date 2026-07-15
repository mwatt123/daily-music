import type { AlbumKey } from "./playCountExtraction";
import type { AlbumOverride } from "./albumOverrides";

export type AlbumClassification =
  | "studio"
  | "single"
  | "ep"
  | "live"
  | "compilation"
  | "reissue";

export interface ClassifiedAlbumRow extends AlbumKey {
  averagePlayCount: number;
  classification: AlbumClassification;
}

export type Confidence = "high" | "low";

export interface DefinitiveAlbumPick extends AlbumKey {
  confidence: Confidence;
}

const ELIGIBLE_CLASSIFICATIONS: readonly AlbumClassification[] = ["studio", "reissue"];

/** Relative margin between the top two candidates' Preference Signal below
 * which a pick is flagged "low" confidence rather than trusted outright. */
const LOW_CONFIDENCE_MARGIN = 0.2;

function confidenceFor(top: ClassifiedAlbumRow, runnerUp: ClassifiedAlbumRow | undefined): Confidence {
  if (!runnerUp) return "high";
  if (top.averagePlayCount === runnerUp.averagePlayCount) return "low";
  const relativeMargin = (top.averagePlayCount - runnerUp.averagePlayCount) / top.averagePlayCount;
  return relativeMargin >= LOW_CONFIDENCE_MARGIN ? "high" : "low";
}

function groupByArtist(rows: ClassifiedAlbumRow[]): Map<string, ClassifiedAlbumRow[]> {
  const byArtist = new Map<string, ClassifiedAlbumRow[]>();
  for (const row of rows) {
    const existing = byArtist.get(row.artist);
    if (existing) existing.push(row);
    else byArtist.set(row.artist, [row]);
  }
  return byArtist;
}

export function selectDefinitiveAlbums(
  rows: ClassifiedAlbumRow[],
  overrides: AlbumOverride[],
): DefinitiveAlbumPick[] {
  const overrideByArtist = new Map(overrides.map((o) => [o.artist, o.album]));
  const picks: DefinitiveAlbumPick[] = [];

  for (const [artist, artistRows] of groupByArtist(rows)) {
    const overrideAlbum = overrideByArtist.get(artist);
    if (overrideAlbum) {
      picks.push({ artist, album: overrideAlbum, confidence: "high" });
      continue;
    }

    const [top, runnerUp] = artistRows
      .filter((row) => ELIGIBLE_CLASSIFICATIONS.includes(row.classification))
      .sort((a, b) => b.averagePlayCount - a.averagePlayCount);

    if (!top) continue;
    picks.push({ artist, album: top.album, confidence: confidenceFor(top, runnerUp) });
  }

  return picks;
}
