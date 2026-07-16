import { STORAGE_KEY, type VisitorIdStore } from "./visitorId";

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
 * `chrome.storage.local`-backed store used by the extension. Persists across
 * new-tab opens and browser restarts, scoped to the browser profile -- the
 * extension analogue of the web app's cookie.
 */
export const chromeLocalStore: VisitorIdStore = {
  async get() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const value = result[STORAGE_KEY];
    return typeof value === "string" ? value : null;
  },
  async set(value) {
    await chrome.storage.local.set({ [STORAGE_KEY]: value });
  },
};
