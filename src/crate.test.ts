import { describe, it, expect } from "vitest";
import { albumKey, createCrate, type CrateStore } from "./crate";
import type { Album } from "./albums";

/** In-memory single-blob store standing in for the web app's localStorage. */
function fakeStore(initial: string | null = null): CrateStore & { value: string | null } {
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

/** Async variant, mirroring the extension's Promise-based chrome.storage.local. */
function asyncFakeStore(initial: string | null = null): CrateStore & { value: string | null } {
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

const funeral: Album = {
  title: "Funeral",
  artist: "Arcade Fire",
  year: 2004,
  coverArtUrl: "cover-funeral",
};

const inRainbows: Album = {
  title: "In Rainbows",
  artist: "Radiohead",
  year: 2007,
  coverArtUrl: "cover-in-rainbows",
};

describe("albumKey", () => {
  it("collapses case, accents, punctuation and spacing to one durable key", () => {
    const key = albumKey({ artist: "Beyoncé", title: "Lemonade" });

    expect(albumKey({ artist: "BEYONCE", title: "Lemonade" })).toBe(key);
    expect(albumKey({ artist: "beyoncé", title: "  Lemonade!  " })).toBe(key);
    expect(albumKey({ artist: "Béyoncé", title: "Lemon-ade" })).toBe(key);
  });

  it("keeps different albums distinct", () => {
    expect(albumKey(funeral)).not.toBe(albumKey(inRainbows));
  });

  it("uses the | boundary so artist/title can't collide across the seam", () => {
    // Without a delimiter both would normalize to "abc".
    expect(albumKey({ artist: "AB", title: "C" })).not.toBe(
      albumKey({ artist: "A", title: "BC" }),
    );
  });
});

describe("createCrate", () => {
  it("reports an album as kept after it is kept", async () => {
    const crate = createCrate(fakeStore());

    expect(await crate.isKept(funeral)).toBe(false);
    await crate.keep(funeral, "2026-07-16");
    expect(await crate.isKept(funeral)).toBe(true);
  });

  it("is idempotent — keeping the same album twice stores one record", async () => {
    const crate = createCrate(fakeStore());

    await crate.keep(funeral, "2026-07-16");
    await crate.keep(funeral, "2026-07-17");

    expect(await crate.list()).toHaveLength(1);
  });

  it("removes a kept album by its key", async () => {
    const crate = createCrate(fakeStore());
    await crate.keep(funeral, "2026-07-16");

    await crate.remove(albumKey(funeral));

    expect(await crate.isKept(funeral)).toBe(false);
    expect(await crate.list()).toHaveLength(0);
  });

  it("lists kept records newest-first", async () => {
    const crate = createCrate(fakeStore());
    await crate.keep(funeral, "2026-07-16");
    await crate.keep(inRainbows, "2026-07-17");

    expect((await crate.list()).map((k) => k.title)).toEqual(["In Rainbows", "Funeral"]);
  });

  it("stores a frozen snapshot immune to later changes to the source album", async () => {
    const store = fakeStore();
    const source: Album = { ...funeral };
    await createCrate(store).keep(source, "2026-07-16");

    // The catalog later re-covers or retitles the album.
    source.coverArtUrl = "cover-changed";
    source.title = "Funeral (Remastered)";

    const [kept] = await createCrate(store).list();
    expect(kept.coverArtUrl).toBe("cover-funeral");
    expect(kept.title).toBe("Funeral");
    expect(kept.keptOn).toBe("2026-07-16");
  });

  it("persists across crate instances sharing a store, independent of any visitor id", async () => {
    const store = fakeStore();
    await createCrate(store).keep(funeral, "2026-07-16");

    // A fresh crate over the same blob sees the kept album — the crate carries
    // no visitor-id dependency, so clearing the identity cookie can't wipe it.
    expect(await createCrate(store).isKept(funeral)).toBe(true);
  });

  it("drives an async (chrome.storage-style) store the same way", async () => {
    const crate = createCrate(asyncFakeStore());

    await crate.keep(funeral, "2026-07-16");
    await crate.keep(inRainbows, "2026-07-17");
    await crate.remove(albumKey(funeral));

    expect(await crate.isKept(funeral)).toBe(false);
    expect((await crate.list()).map((k) => k.title)).toEqual(["In Rainbows"]);
  });

  it("fails safe to an empty crate on a malformed blob", async () => {
    const crate = createCrate(fakeStore("not json {"));

    expect(await crate.list()).toEqual([]);
    expect(await crate.isKept(funeral)).toBe(false);
  });

  it("fails safe to an empty crate on an unrecognized schema version", async () => {
    const crate = createCrate(
      fakeStore(JSON.stringify({ version: 999, keptAlbums: [{ key: "x|y" }] })),
    );

    expect(await crate.list()).toEqual([]);
  });
});
