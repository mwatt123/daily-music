import { describe, it, expect } from "vitest";
import { webcrypto } from "node:crypto";
import { getVisitorId, type VisitorIdStore } from "./visitorId";

// `crypto` is a global on both target surfaces (browser page + extension page);
// the Node test env predates it, so provide the Web Crypto implementation here.
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto;
}

/** In-memory store standing in for either surface's real backend. */
function fakeStore(initial: string | null = null): VisitorIdStore & { value: string | null } {
  return {
    value: initial,
    get() {
      return this.value;
    },
    set(value) {
      this.value = value;
    },
  };
}

/** Async variant, mirroring `chrome.storage.local`'s Promise-based API. */
function asyncFakeStore(initial: string | null = null): VisitorIdStore & { value: string | null } {
  return {
    value: initial,
    async get() {
      return this.value;
    },
    async set(value) {
      this.value = value;
    },
  };
}

describe("getVisitorId", () => {
  it("returns the existing id without overwriting it", async () => {
    const store = fakeStore("existing-id");

    const id = await getVisitorId(store);

    expect(id).toBe("existing-id");
    expect(store.value).toBe("existing-id");
  });

  it("creates and persists a new id when the store is empty", async () => {
    const store = fakeStore(null);

    const id = await getVisitorId(store);

    expect(id).toMatch(/[0-9a-f-]{36}/);
    expect(store.value).toBe(id);
  });

  it("is stable across repeated calls once an id has been persisted", async () => {
    const store = fakeStore(null);

    const first = await getVisitorId(store);
    const second = await getVisitorId(store);

    expect(second).toBe(first);
  });

  it("drives an async (chrome.storage-style) store the same way", async () => {
    const store = asyncFakeStore(null);

    const first = await getVisitorId(store);
    const second = await getVisitorId(store);

    expect(first).toMatch(/[0-9a-f-]{36}/);
    expect(second).toBe(first);
    expect(store.value).toBe(first);
  });
});
