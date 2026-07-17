import { describe, it, expect, afterEach } from "vitest";
import { chromeLocalStringStore } from "./chromeStorage";

/** Minimal in-memory stand-in for the chrome.storage.local area, keyed like the real one. */
function fakeChrome(): { store: Record<string, unknown> } {
  const store: Record<string, unknown> = {};
  (globalThis as { chrome?: unknown }).chrome = {
    storage: {
      local: {
        async get(key: string) {
          return key in store ? { [key]: store[key] } : {};
        },
        async set(items: Record<string, unknown>) {
          Object.assign(store, items);
        },
      },
    },
  };
  return { store };
}

afterEach(() => {
  delete (globalThis as { chrome?: unknown }).chrome;
});

describe("chromeLocalStringStore", () => {
  it("round-trips a value through the given key", async () => {
    const backing = fakeChrome();
    const store = chromeLocalStringStore("dailyAlbum.crate");

    await store.set("blob");

    expect(backing.store["dailyAlbum.crate"]).toBe("blob");
    expect(await store.get()).toBe("blob");
  });

  it("returns null when the key is absent", async () => {
    fakeChrome();
    expect(await chromeLocalStringStore("visitorId").get()).toBeNull();
  });

  it("isolates two stores that use different keys", async () => {
    fakeChrome();
    const idStore = chromeLocalStringStore("visitorId");
    const crateStore = chromeLocalStringStore("dailyAlbum.crate");

    await idStore.set("v-123");

    // A different key sees nothing -- the crate is independent of the visitor id.
    expect(await crateStore.get()).toBeNull();
    expect(await idStore.get()).toBe("v-123");
  });
});
