import type { Album } from "./albums";
import { getLocalDateString } from "./dailyAlbum";

/** localStorage key holding the whole crate blob. Fixed and independent of the
 * visitor id, so clearing the identity cookie does not wipe the crate. */
export const CRATE_STORAGE_KEY = "dailyAlbum.crate";

const SCHEMA_VERSION = 1;

/**
 * A single kept album, frozen at keep time (a snapshot, not a reference) so the
 * crate renders from its own copy and is immune to later catalog edits --
 * re-covers, title fixes, removals.
 */
export interface KeptAlbum {
  key: string;
  title: string;
  artist: string;
  year: number;
  coverArtUrl: string;
  /** YYYY-MM-DD local date, stored for a possible future "year in review"; not shown. */
  keptOn: string;
}

/**
 * A pluggable single-string-blob backend, mirroring {@link VisitorIdStore}. The
 * web app backs this with `localStorage`; tests back it with an in-memory
 * adapter. Synchronous because the only real backend (`localStorage`) is
 * synchronous and only the web app uses the crate -- the extension is untouched.
 */
export interface CrateStore {
  get(): string | null;
  set(value: string): void;
}

/**
 * The crate's small interface over the injected store. `keep`/`remove` mutate,
 * `isKept`/`list` read; all the JSON (de)serialization, dedup, snapshotting and
 * fail-safe parsing live behind it.
 */
export interface Crate {
  /** Snapshot today's pick into the crate. Idempotent by {@link albumKey}. */
  keep(album: Album, keptOn?: string): void;
  /** Prune the record with this key; a no-op if it isn't kept. */
  remove(key: string): void;
  isKept(album: Pick<Album, "artist" | "title">): boolean;
  /** Kept snapshots, newest first. */
  list(): KeptAlbum[];
}

function normalizePart(s: string): string {
  return s
    .normalize("NFD") // decompose accents: é -> e + combining mark
    .replace(/[̀-ͯ]/g, "") // strip the combining marks
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // drop spaces, punctuation, symbols
}

/**
 * Derives an album's durable identity by normalizing artist and title
 * independently and joining with `|` -- the one character `normalizePart` never
 * emits, so the artist/title boundary is unambiguous and can't collide. Computed
 * once at keep time and stored frozen, so a later change to this rule can't
 * orphan existing entries. (Article/word changes like "The Beatles" vs "Beatles"
 * stay distinct -- semantic, out of scope; a purely non-Latin title normalizes
 * toward empty, acceptable for this catalog.)
 */
export function albumKey(album: Pick<Album, "artist" | "title">): string {
  return normalizePart(album.artist) + "|" + normalizePart(album.title);
}

interface CrateData {
  version: number;
  keptAlbums: KeptAlbum[];
}

function empty(): CrateData {
  return { version: SCHEMA_VERSION, keptAlbums: [] };
}

/**
 * Reads and validates the stored blob, failing safe to an empty crate on any
 * parse error or unrecognized `version` -- a corrupt or future blob can never
 * crash the page.
 */
function read(store: CrateStore): CrateData {
  const raw = store.get();
  if (!raw) return empty();
  try {
    const parsed = JSON.parse(raw) as Partial<CrateData>;
    if (parsed?.version !== SCHEMA_VERSION || !Array.isArray(parsed.keptAlbums)) {
      return empty();
    }
    return { version: SCHEMA_VERSION, keptAlbums: parsed.keptAlbums };
  } catch {
    return empty();
  }
}

function write(store: CrateStore, data: CrateData): void {
  store.set(JSON.stringify(data));
}

/**
 * The Crate module (the one primary seam of the crate-digging feature). A deep
 * module: a lot of behaviour -- snapshotting, dedup, newest-first ordering,
 * fail-safe (de)serialization -- behind four small methods over an injected
 * {@link CrateStore}, mirroring how `getVisitorId` drives an injected store.
 */
export function createCrate(store: CrateStore): Crate {
  return {
    keep(album, keptOn = getLocalDateString()) {
      const key = albumKey(album);
      const data = read(store);
      if (data.keptAlbums.some((k) => k.key === key)) return; // already kept
      data.keptAlbums.push({
        key,
        title: album.title,
        artist: album.artist,
        year: album.year,
        coverArtUrl: album.coverArtUrl,
        keptOn,
      });
      write(store, data);
    },

    remove(key) {
      const data = read(store);
      const keptAlbums = data.keptAlbums.filter((k) => k.key !== key);
      if (keptAlbums.length !== data.keptAlbums.length) {
        write(store, { ...data, keptAlbums });
      }
    },

    isKept(album) {
      const key = albumKey(album);
      return read(store).keptAlbums.some((k) => k.key === key);
    },

    list() {
      // Stored in keep order; reverse for newest-first display.
      return read(store).keptAlbums.slice().reverse();
    },
  };
}

/**
 * The web app's real store: `localStorage` under the fixed {@link CRATE_STORAGE_KEY}.
 */
export const localStorageCrateStore: CrateStore = {
  get: () => localStorage.getItem(CRATE_STORAGE_KEY),
  set: (value) => localStorage.setItem(CRATE_STORAGE_KEY, value),
};
