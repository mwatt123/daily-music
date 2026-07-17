/**
 * The publish version derives from the release tag, guarded against a mistaken
 * downgrade -- the one piece of real logic in the auto-publish pipeline, kept
 * pure so it can be unit-tested through its interface (see extensionVersion.test.ts).
 * The workflow only stamps and uploads; this decides what version is allowed.
 */

/** Parse a strict MAJOR.MINOR.PATCH string into its three numbers, or null. */
function parseSemver(version: string): [number, number, number] | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** Negative if a < b, positive if a > b, zero if equal -- compared part by part. */
function compareSemver(a: [number, number, number], b: [number, number, number]): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

/**
 * Derive the extension version to publish from a release tag (`v1.3.0` -> `1.3.0`),
 * guarding that it strictly increments over `baseline` (the currently published
 * version). Throws on a malformed tag, a malformed baseline, or a non-incrementing
 * version -- so CI fails fast, before an upload the Chrome Web Store would reject.
 */
export function deriveExtensionVersion(tag: string, baseline: string): string {
  const match = tag.match(/^v(\d+\.\d+\.\d+)$/);
  if (!match) {
    throw new Error(
      `Tag "${tag}" is not a version tag of the form vMAJOR.MINOR.PATCH (e.g. v1.3.0).`,
    );
  }
  const version = match[1];

  const parsedBaseline = parseSemver(baseline);
  if (!parsedBaseline) {
    throw new Error(`Baseline version "${baseline}" is not a valid MAJOR.MINOR.PATCH version.`);
  }

  // parseSemver(version) can't be null: the tag regex already proved the shape.
  if (compareSemver(parseSemver(version)!, parsedBaseline) <= 0) {
    throw new Error(
      `Version ${version} does not strictly increment over the published baseline ${baseline}.`,
    );
  }

  return version;
}
