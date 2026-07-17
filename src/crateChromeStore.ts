import { CRATE_STORAGE_KEY, type CrateStore } from "./crate";
import { chromeLocalStringStore } from "./chromeStorage";

/**
 * `chrome.storage.local`-backed crate store for the extension -- the durable,
 * per-profile analogue of the web app's `localStorage` crate. Independent of the
 * visitor id (a different key in the same area), so resetting the id never wipes
 * the crate. Extension origins are isolated from the web app's, so this crate is
 * necessarily separate from the web app's (per-surface, by browser design).
 */
export const chromeCrateStore: CrateStore = chromeLocalStringStore(CRATE_STORAGE_KEY);
