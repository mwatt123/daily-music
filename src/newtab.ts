import { getVisitorId, type VisitorIdStore } from "./visitorId";
import { getLocalDateString, selectDailyAlbum } from "./dailyAlbum";
import type { Album } from "./albums";
import type { ExtractedColors } from "./dominantColor";
import { applyAlbumColors, renderAlbum } from "./renderAlbum";

export interface NewTabDeps {
  container: HTMLElement;
  store: VisitorIdStore;
  albums: Album[];
  /** Precomputed colors keyed by `coverArtUrl` (see src/albumColors.ts). */
  colors: Record<string, ExtractedColors>;
  /** Overridable for tests; defaults to the visitor's local date. */
  date?: string;
}

/**
 * Renders the extension new-tab page: resolve the visitor id from the injected
 * store, pick today's album, draw it, then apply the album's *precomputed*
 * colors. Unlike the web app it does no runtime canvas extraction -- colors are
 * bundled, which sidesteps MV3's CSP/canvas-tainting entirely. If a cover has
 * no precomputed entry (e.g. its URL changed since the last `curate:colors`
 * run), the page keeps the style.css fallback colors rather than failing.
 * Dependency-injected so the whole flow is testable without a real extension.
 */
export async function initNewTab(deps: NewTabDeps): Promise<Album> {
  const { container, store, albums, colors, date } = deps;

  const visitorId = await getVisitorId(store);
  const album = selectDailyAlbum(visitorId, date ?? getLocalDateString(), albums);

  renderAlbum(container, album);
  applyAlbumColors(colors, album.coverArtUrl);

  return album;
}
