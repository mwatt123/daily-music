const COOKIE_NAME = "visitorId";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 2; // ~2 years

function readCookie(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax`;
}

/**
 * Returns this browser's anonymous visitor id, creating and persisting one
 * on first visit (or silently replacing it if the cookie was cleared).
 */
export function getVisitorId(): string {
  const existing = readCookie(COOKIE_NAME);
  if (existing) return existing;

  const id = crypto.randomUUID();
  writeCookie(COOKIE_NAME, id, COOKIE_MAX_AGE_SECONDS);
  return id;
}
