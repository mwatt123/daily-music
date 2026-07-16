import "./style.css";
import { cookieStore, getVisitorId } from "./visitorId";
import { getLocalDateString, selectDailyAlbum } from "./dailyAlbum";
import { albums } from "./albums";
import { extractDominantColors } from "./dominantColor";
import { applyColors, renderAlbum } from "./renderAlbum";

// Wrapped in an async IIFE (rather than top-level await) so the default Vite
// build target still applies -- reading the id from the cookie store is now
// async to share one code path with the extension's chrome.storage backend.
(async () => {
  const visitorId = await getVisitorId(cookieStore);
  const album = selectDailyAlbum(visitorId, getLocalDateString(), albums);

  renderAlbum(document.querySelector<HTMLDivElement>("#app")!, album);

  // Web app extracts the album's colors from its cover at runtime (canvas);
  // the page shows the style.css fallback colors until this resolves.
  extractDominantColors(album.coverArtUrl).then(({ primary, secondary }) => {
    applyColors(primary, secondary);
  });
})();
