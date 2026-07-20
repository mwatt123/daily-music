import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { deriveExtensionVersion } from "./extensionVersion";

// CI step: stamp the release version -- derived from the pushed git tag -- into
// the BUILT dist-extension/manifest.json, so the published package's version comes
// from the tag and can never be a stale hand-edited value. Fails fast (before
// upload) on a bad tag or a non-incrementing version. Tag comes from argv[2] or
// $GITHUB_REF_NAME.

// The version currently live on the Chrome Web Store: the floor a new tag must
// beat. Kept here as a labelled constant -- deliberately NOT read from the
// committed extension/manifest.json, whose version is only a "load unpacked" dev
// default -- so the guard compares against what is actually published. Bump this
// when raising the floor; the store itself is the final arbiter of monotonicity.
const LAST_PUBLISHED_VERSION = "1.3.1";

const tag = process.argv[2] ?? process.env.GITHUB_REF_NAME;
if (!tag) {
  throw new Error(
    "No tag provided. Pass one as an argument, or set GITHUB_REF_NAME (the pushed tag).",
  );
}

const version = deriveExtensionVersion(tag, LAST_PUBLISHED_VERSION);

const builtManifestPath = fileURLToPath(new URL("../dist-extension/manifest.json", import.meta.url));
const builtManifest = JSON.parse(readFileSync(builtManifestPath, "utf-8"));
builtManifest.version = version;
writeFileSync(builtManifestPath, `${JSON.stringify(builtManifest, null, 2)}\n`);

console.log(
  `Stamped dist-extension/manifest.json: ${LAST_PUBLISHED_VERSION} -> ${version} (from tag ${tag}).`,
);
