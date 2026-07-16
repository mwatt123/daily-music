export const STORAGE_KEY = "visitorId";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 2; // ~2 years

/**
 * A pluggable backend for reading/writing the persisted visitor id. The web app
 * backs this with a cookie; the extension backs it with `chrome.storage.local`.
 * Both `get` and `set` may be async so a single `getVisitorId` can drive either
 * surface -- `chrome.storage` is Promise-based, and awaiting a sync cookie is
 * harmless.
 */
export interface VisitorIdStore {
  get(): string | null | Promise<string | null>;
  set(value: string): void | Promise<void>;
}

function readCookie(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax`;
}

/** Cookie-backed store used by the web app (its historical behavior, unchanged). */
export const cookieStore: VisitorIdStore = {
  get: () => readCookie(STORAGE_KEY),
  set: (value) => writeCookie(STORAGE_KEY, value, COOKIE_MAX_AGE_SECONDS),
};

/**
 * Returns this browser's anonymous visitor id, creating and persisting one on
 * first visit (or silently replacing it if the underlying store was cleared).
 * The seed logic in `selectDailyAlbum` stays pure -- surface differences live
 * entirely in the injected {@link VisitorIdStore}.
 */
export async function getVisitorId(
  store: VisitorIdStore = cookieStore,
): Promise<string> {
  const existing = await store.get();
  if (existing) return existing;

  const id = crypto.randomUUID();
  await store.set(id);
  return id;
}
