import type { Album } from "./albums";

/** The trailing numeric iTunes album id in an Apple Music album URL, or null. */
function appleAlbumId(appleUrl: string): string | null {
  const match = appleUrl.match(/\/(\d+)(?:[/?#]|$)/);
  return match ? match[1] : null;
}

/**
 * A zero-network link for the Listen affordance, resolving to whichever music
 * service the listener uses. When an album has a curated Apple Music URL, we turn
 * its iTunes album id into an Odesli **album.link** universal link -- one page
 * that offers Spotify, Apple Music, YouTube Music, Tidal, and more (a pure static
 * URL: no API, no key, no runtime fetch). Where an album has no curated URL, we
 * fall back to a zero-network Apple Music *search* URL as a last resort. Either
 * branch is a static link, so Listen always works.
 */
export function listenUrlFor(
  album: Pick<Album, "artist" | "title" | "listenUrl">,
): string {
  if (album.listenUrl) {
    const id = appleAlbumId(album.listenUrl);
    // Universal chooser when we can read the id; otherwise the Apple album page
    // itself (still a valid link) rather than dropping to a search.
    return id ? `https://album.link/i/${id}` : album.listenUrl;
  }
  const term = encodeURIComponent(`${album.artist} ${album.title}`);
  return `https://music.apple.com/search?term=${term}`;
}
