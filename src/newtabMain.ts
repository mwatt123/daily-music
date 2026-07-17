import "./style.css";
import { albums } from "./albums";
import { albumColors } from "./albumColors";
import { chromeLocalStore } from "./visitorIdChromeStore";
import { createCrate } from "./crate";
import { chromeCrateStore } from "./crateChromeStore";
import { initShelf } from "./shelf";

// The extension new-tab entry point. Renders the same "Shelf" as the web app via
// the shared initShelf composition -- the calm daily card still owns the first
// screen, with the crate one scroll below. The only difference from the web app
// is storage: the visitor id and the crate both live in chrome.storage.local (the
// durable per-profile analogue of the web app's cookie + localStorage). Extension
// and web origins are isolated, so this crate is per-surface by design.
initShelf({
  container: document.querySelector<HTMLDivElement>("#app")!,
  store: chromeLocalStore,
  crate: createCrate(chromeCrateStore),
  albums,
  colors: albumColors,
});
