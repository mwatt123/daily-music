/**
 * Minimal shape of the slice of `chrome.storage.local` we use. Declared locally
 * rather than pulling in `@types/chrome` so the web app's build stays clean --
 * only extension entry points reach this module (transitively, via the per-feature
 * stores built on {@link chromeLocalStringStore}).
 */
interface ChromeStorageArea {
  get(keys: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}
declare const chrome: { storage: { local: ChromeStorageArea } };

/**
 * A single-string-blob store over one `chrome.storage.local` key -- the async,
 * per-profile backend the extension uses for both the visitor id and the crate.
 * Its `{ get, set }` shape satisfies both `VisitorIdStore` and `CrateStore`, so
 * each surface just names the key; the storage plumbing lives here once.
 */
export function chromeLocalStringStore(key: string): {
  get(): Promise<string | null>;
  set(value: string): Promise<void>;
} {
  return {
    async get() {
      const result = await chrome.storage.local.get(key);
      const value = result[key];
      return typeof value === "string" ? value : null;
    },
    async set(value) {
      await chrome.storage.local.set({ [key]: value });
    },
  };
}
