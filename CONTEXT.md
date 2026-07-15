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
