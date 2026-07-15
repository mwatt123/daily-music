# Daily Album Recommendation

A web app that shows each visitor one album recommendation per day, with the page's color theme driven by that album's cover art.

## Language

**Dominant Color**:
The most visually prominent color in an album's cover art, extracted client-side by sampling the artwork's pixels and finding the most frequent saturated one. Normalized to a consistent saturation/brightness range afterward so it always reads as vivid, regardless of how muted or dark the source pixel was.
_Avoid_: Average color (a different, rejected computation), primary color

**Secondary Color**:
A second color extracted alongside the Dominant Color from the same artwork, chosen to be sufficiently different from it. Used together as a pair to theme a page around an album, rather than a single flat tint.
_Avoid_: Accent color, theme color
