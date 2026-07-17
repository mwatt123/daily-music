import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const manifestPath = fileURLToPath(new URL("../extension/manifest.json", import.meta.url));
const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

describe("extension manifest", () => {
  it("is a Manifest V3 new-tab override named Broken Record", () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe("Broken Record");
    expect(manifest.chrome_url_overrides.newtab).toBe("newtab.html");
  });

  it("requests the storage permission the visitor id and crate need", () => {
    expect(manifest.permissions).toContain("storage");
  });

  it("references icon files that exist on disk", () => {
    const sizes = Object.keys(manifest.icons);
    expect(sizes.length).toBeGreaterThan(0);

    for (const size of sizes) {
      const iconPath = fileURLToPath(
        new URL(`../extension/${manifest.icons[size]}`, import.meta.url),
      );
      expect(existsSync(iconPath), `${manifest.icons[size]} should exist`).toBe(true);
    }
  });
});
