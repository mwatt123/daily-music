import { CRATE_STORAGE_KEY, type CrateStore } from "./crate";

/**
 * Minimal shape of the slice of `chrome.storage.local` we use. Declared locally
 * rather than pulling in `@types/chrome` so the web app's build stays clean --
 * only the extension entry point imports this module.
 */
interface ChromeStorageArea {
  get(keys: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}
declare const chrome: { storage: { local: ChromeStorageArea } };

/**
 * `chrome.storage.local`-backed crate store for the extension -- the durable,
 * per-profile analogue of the web app's `localStorage` crate. Independent of the
 * visitor id (a different key in the same area), so resetting the id never wipes
 * the crate. Extension origins are isolated from the web app's, so this crate is
 * necessarily separate from the web app's (per-surface, by browser design).
 */
export const chromeCrateStore: CrateStore = {
  async get() {
    const result = await chrome.storage.local.get(CRATE_STORAGE_KEY);
    const value = result[CRATE_STORAGE_KEY];
    return typeof value === "string" ? value : null;
  },
  async set(value) {
    await chrome.storage.local.set({ [CRATE_STORAGE_KEY]: value });
  },
};
