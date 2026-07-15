# Extract Dominant Color live in the browser, not at curation time

`coverArtUrl` is precomputed at curation time specifically to avoid runtime cost and a suspected CORS risk (reading pixel data from a cross-origin image can throw a security error on a "tainted" canvas). Dominant Color extraction was originally planned the same way, for the same reason.

While prototyping the theming feature, we tested the CORS risk directly: Apple's cover-art CDN sends `access-control-allow-origin: *`, so `getImageData` on those images works cleanly — the risk that motivated precomputing doesn't apply here. We chose live extraction instead: it needs no re-curation step when new albums are added (curation already only outputs `coverArtUrl`, not a color), at the cost of a brief "extracting colors…" moment on page load.

A future reader comparing this to `coverArtUrl`'s precompute-at-curation-time pattern should not assume the same reasoning applies — the CORS risk that justified it there was checked and ruled out here.
