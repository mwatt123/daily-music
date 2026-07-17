import type { Album } from "./albums";
import type { ExtractedColors } from "./dominantColor";

/**
 * Renders the daily album card into `container`. Shared verbatim by the web app
 * and the extension new-tab page (both via `shelf.ts`) so the markup has a single
 * source of truth; the two surfaces differ only in how they source the visitor
 * id, the crate, and the colors, not in what they draw.
 */
export function renderAlbum(container: HTMLElement, album: Album): void {
  container.innerHTML = `
    <div class="content">
      <div class="eyebrow">Today's Pick</div>
      <img class="cover-art" src="${album.coverArtUrl}" alt="${album.title} cover art" />
      <h1 class="title">${album.title}</h1>
      <div class="meta">${album.artist} &middot; ${album.year}</div>
    </div>
  `;
}

/**
 * Swaps in the album's primary/secondary colors by setting the two CSS custom
 * properties the stylesheet reads. The page renders first with the fallback
 * colors in style.css, then this transitions them in place without re-rendering.
 */
export function applyColors(primary: string, secondary: string): void {
  document.documentElement.style.setProperty("--color-primary", primary);
  document.documentElement.style.setProperty("--color-secondary", secondary);
}

/**
 * Applies the precomputed colors for `coverArtUrl` from the bundled table, if it
 * has an entry. Both surfaces build the same table offline (see src/albumColors.ts)
 * and neither samples at runtime, so this owns the one shared rule: a cover with
 * no entry (e.g. its URL changed since the last curate:colors run) keeps the
 * style.css fallback rather than failing.
 */
export function applyAlbumColors(
  colors: Record<string, ExtractedColors>,
  coverArtUrl: string,
): void {
  const precomputed = colors[coverArtUrl];
  if (precomputed) {
    applyColors(precomputed.primary, precomputed.secondary);
  }
}
