import type { Album } from "./albums";

/** Odesli universal-link base: append an iTunes album id to reach the chooser. */
const ALBUM_LINK = "https://album.link/i/";

/**
 * The trailing numeric iTunes album id in an Apple Music album URL, or null. The
 * id is always the last path segment, so it must be terminated by the string end,
 * a query, or a fragment -- never another `/`. (Apple slugifies a numeric *title*
 * into the path too, e.g. `/album/7/1353635536`, so matching the first `/digits/`
 * would grab the title, not the id.)
 */
function appleAlbumId(appleUrl: string): string | null {
  const match = appleUrl.match(/\/(\d+)(?:[?#]|$)/);
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
    return id ? `${ALBUM_LINK}${id}` : album.listenUrl;
  }
  const term = encodeURIComponent(`${album.artist} ${album.title}`);
  return `https://music.apple.com/search?term=${term}`;
}
