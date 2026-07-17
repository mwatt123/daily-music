# Daily Album Recommendation

A web app that shows each visitor one album recommendation per day, with the page's color theme driven by that album's cover art.

## Language

**Dominant Color**:
The most visually prominent color in an album's cover art, extracted client-side by sampling the artwork's pixels and finding the most frequent saturated one. Normalized to a consistent saturation/brightness range afterward so it always reads as vivid, regardless of how muted or dark the source pixel was.
_Avoid_: Average color (a different, rejected computation), primary color

**Secondary Color**:
A second color extracted alongside the Dominant Color from the same artwork, chosen to be sufficiently different from it. Its lightness (not hue) is further adjusted after extraction to guarantee legible text contrast — at least a WCAG AA 4.5:1 ratio — against the Dominant Color, since Secondary Color is used exclusively for text rendered on a Dominant Color background.
_Avoid_: Accent color, theme color

**Preference Signal**:
The average per-track play count for an album, derived from a personal Apple Music library export, used to rank which of an artist's albums best represents them during curation.
_Avoid_: Play count (ambiguous between track-level and album-level), popularity score

**Definitive Album**:
The single album selected to represent an artist in the curated dataset — the highest-Preference-Signal album, unless overridden by a manual pin. Each artist has exactly one.
_Avoid_: Top album, best album

**Crate**:
The visitor's personal, on-device collection of albums they chose to hold onto — a wall of Kept records. Stored per-surface and independent of the visitor id (so resetting the id never wipes it): `localStorage` on the web app, `chrome.storage.local` on the extension. Because browser origins are isolated, the two surfaces keep separate crates — there is no cross-surface sync. Purely a keepsake: it never steers which album is picked. Each entry is a frozen snapshot, so later catalog edits (re-covers, retitles, removals) leave the collection intact.
_Avoid_: Collection, library, favorites, history

**Keep**:
The single verb on the daily pick: add today's album to the Crate. Keep-only — there is no "pass"; not keeping persists nothing and the pick simply rolls away at local midnight. Reversible: a Keep can be undone, and a record pruned from the Crate at any time. Today's pick is binary — in the Crate or not.
_Avoid_: Save, like, collect, pass

**Album key**:
An album's durable identity, used to dedupe the Crate and recognize a re-picked album as already Kept. Computed as normalized artist + `"|"` + normalized title, where normalization strips accents, lowercases, and drops every non-`[a-z0-9]` character — so minor catalog wording changes don't orphan a Kept record. Stored frozen alongside the snapshot.
_Avoid_: Album id, slug
