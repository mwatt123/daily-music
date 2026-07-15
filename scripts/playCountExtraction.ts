export interface AlbumKey {
  artist: string;
  album: string;
}

export interface AlbumPlayCount extends AlbumKey {
  averagePlayCount: number;
}

function findMatchingDictClose(xml: string, openTagIndex: number): number {
  const dictTag = /<\/?dict>/g;
  dictTag.lastIndex = openTagIndex;
  let depth = 0;
  let match: RegExpExecArray | null;
  while ((match = dictTag.exec(xml))) {
    depth += match[0] === "<dict>" ? 1 : -1;
    if (depth === 0) return match.index;
  }
  throw new Error("Unbalanced <dict> tags in plist XML");
}

const XML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

function unescapeXml(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&(amp|lt|gt|quot|apos);/g, (_, name) => XML_ENTITIES[name]);
}

function extractField(
  trackXml: string,
  key: string,
  tag: "string" | "integer",
): string | undefined {
  const match = trackXml.match(new RegExp(`<key>${key}</key>\\s*<${tag}>([^<]*)</${tag}>`));
  return match?.[1];
}

/** Exact `(artist, album)` identity — deliberately no normalization, so
 * near-duplicate titles (e.g. remasters) stay as separate rows. */
function albumKey({ artist, album }: AlbumKey): string {
  return JSON.stringify([artist, album]);
}

export function extractAlbumPlayCounts(xml: string): AlbumPlayCount[] {
  const tracksKeyIndex = xml.indexOf("<key>Tracks</key>");
  const dictOpenIndex = xml.indexOf("<dict>", tracksKeyIndex);
  const dictCloseIndex = findMatchingDictClose(xml, dictOpenIndex);
  const tracksBlock = xml.slice(dictOpenIndex + "<dict>".length, dictCloseIndex);

  const totals = new Map<string, AlbumKey & { totalPlayCount: number; trackCount: number }>();

  const trackDictPattern = /<dict>([\s\S]*?)<\/dict>/g;
  let trackMatch: RegExpExecArray | null;
  while ((trackMatch = trackDictPattern.exec(tracksBlock))) {
    const trackXml = trackMatch[1];
    const artist = extractField(trackXml, "Artist", "string");
    const album = extractField(trackXml, "Album", "string");
    if (!artist || !album) continue;

    const identity: AlbumKey = { artist: unescapeXml(artist), album: unescapeXml(album) };
    const playCountField = extractField(trackXml, "Play Count", "integer");
    const playCount = playCountField ? Number(playCountField) : 0;

    const key = albumKey(identity);
    const existing = totals.get(key);
    if (existing) {
      existing.totalPlayCount += playCount;
      existing.trackCount += 1;
    } else {
      totals.set(key, { ...identity, totalPlayCount: playCount, trackCount: 1 });
    }
  }

  return [...totals.values()].map(({ artist, album, totalPlayCount, trackCount }) => ({
    artist,
    album,
    averagePlayCount: totalPlayCount / trackCount,
  }));
}
