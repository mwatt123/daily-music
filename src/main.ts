import "./style.css";
import { cookieStore } from "./visitorId";
import { albums } from "./albums";
import { albumColors } from "./albumColors";
import { createCrate, localStorageCrateStore } from "./crate";
import { initShelf } from "./shelf";

// Wrapped in an async IIFE (rather than top-level await) so the default Vite
// build target still applies -- reading the id from the cookie store is async to
// share one code path with the extension's chrome.storage backend.
//
// The web app renders "The Shelf": today's pick plus the on-device crate. The
// crate is backed by localStorage under a fixed key (independent of the visitor
// id, so clearing the identity cookie doesn't wipe it). The extension entry
// (newtabMain.ts) is deliberately unchanged -- it keeps the plain single card.
initShelf({
  container: document.querySelector<HTMLDivElement>("#app")!,
  store: cookieStore,
  crate: createCrate(localStorageCrateStore),
  albums,
  colors: albumColors,
});
