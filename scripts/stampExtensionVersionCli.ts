import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { deriveExtensionVersion } from "./extensionVersion";

// CI step: stamp the release version -- derived from the pushed git tag -- into
// the BUILT dist-extension/manifest.json, so the published package's version comes
// from the tag and can never be a stale hand-edited value. The committed
// extension/manifest.json keeps its dev-default version and doubles as the baseline
// the new version must strictly beat. Fails fast (before upload) on a bad tag or a
// non-incrementing version. Tag comes from argv[2] or $GITHUB_REF_NAME.

const tag = process.argv[2] ?? process.env.GITHUB_REF_NAME;
if (!tag) {
  throw new Error(
    "No tag provided. Pass one as an argument, or set GITHUB_REF_NAME (the pushed tag).",
  );
}

const committedManifestPath = fileURLToPath(new URL("../extension/manifest.json", import.meta.url));
const builtManifestPath = fileURLToPath(new URL("../dist-extension/manifest.json", import.meta.url));

const baseline = JSON.parse(readFileSync(committedManifestPath, "utf-8")).version as string;
const version = deriveExtensionVersion(tag, baseline);

const builtManifest = JSON.parse(readFileSync(builtManifestPath, "utf-8"));
builtManifest.version = version;
writeFileSync(builtManifestPath, `${JSON.stringify(builtManifest, null, 2)}\n`);

console.log(`Stamped dist-extension/manifest.json: ${baseline} -> ${version} (from tag ${tag}).`);
