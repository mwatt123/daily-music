import type { Album } from "./albums";

/**
 * A zero-network link for the Listen affordance. Uses the album's curated
 * `listenUrl` (an Apple Music album URL resolved at curation time -- exact album,
 * no runtime network, no key) when one is present; otherwise falls back to an
 * Apple Music *search* URL built from artist + title. Either branch is a pure
 * static link, so Listen always works and degrades gracefully before the catalog
 * is fully backfilled with resolved URLs.
 */
export function listenUrlFor(
  album: Pick<Album, "artist" | "title" | "listenUrl">,
): string {
  if (album.listenUrl) return album.listenUrl;
  const term = encodeURIComponent(`${album.artist} ${album.title}`);
  return `https://music.apple.com/search?term=${term}`;
}
