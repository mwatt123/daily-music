import "./style.css";
import { cookieStore, getVisitorId } from "./visitorId";
import { getLocalDateString, selectDailyAlbum } from "./dailyAlbum";
import { albums } from "./albums";
import { albumColors } from "./albumColors";
import { applyAlbumColors, renderAlbum } from "./renderAlbum";

// Wrapped in an async IIFE (rather than top-level await) so the default Vite
// build target still applies -- reading the id from the cookie store is now
// async to share one code path with the extension's chrome.storage backend.
(async () => {
  const visitorId = await getVisitorId(cookieStore);
  const album = selectDailyAlbum(visitorId, getLocalDateString(), albums);

  renderAlbum(document.querySelector<HTMLDivElement>("#app")!, album);

  // Colors are precomputed at build time (see src/albumColors.ts) and shared
  // with the extension -- no runtime canvas extraction. The page shows the
  // style.css fallback until this applies.
  applyAlbumColors(albumColors, album.coverArtUrl);
})();
