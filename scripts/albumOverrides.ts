import type { AlbumKey } from "./playCountExtraction";

export type AlbumOverride = AlbumKey;

/** Hand-maintained pins: artist -> album, used only when the automated
 * Preference Signal ranking doesn't match your actual taste. Add entries
 * here as you notice a wrong pick after running the re-curation pipeline
 * -- this is not meant to be curated exhaustively up front. */
export const albumOverrides: AlbumOverride[] = [];
