import { STORAGE_KEY, type VisitorIdStore } from "./visitorId";
import { chromeLocalStringStore } from "./chromeStorage";

/**
 * `chrome.storage.local`-backed store used by the extension. Persists across
 * new-tab opens and browser restarts, scoped to the browser profile -- the
 * extension analogue of the web app's cookie.
 */
export const chromeLocalStore: VisitorIdStore = chromeLocalStringStore(STORAGE_KEY);
