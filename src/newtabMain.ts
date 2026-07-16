import "./style.css";
import { albums } from "./albums";
import { albumColors } from "./albumColors";
import { chromeLocalStore } from "./visitorIdChromeStore";
import { initNewTab } from "./newtab";

// The extension new-tab entry point. Wires the real dependencies into the
// testable initNewTab core; only runs inside the extension page.
initNewTab({
  container: document.querySelector<HTMLDivElement>("#app")!,
  store: chromeLocalStore,
  albums,
  colors: albumColors,
});
