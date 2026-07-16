import { resolve } from "node:path";
import { defineConfig } from "vite";

// Second build target: the "Broken Record" Chrome extension. Builds newtab.html
// (not the web app's index.html) into dist-extension/, and copies the static
// extension assets (manifest.json + icons/) from the `extension/` publicDir to
// the bundle root, yielding a directory ready for "Load unpacked".
export default defineConfig({
  base: "./",
  publicDir: resolve(__dirname, "extension"),
  build: {
    outDir: "dist-extension",
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "newtab.html"),
    },
  },
});
