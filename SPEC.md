# Daily Album Recommendation — Spec

## Overview

A single-page web app. Each visitor gets exactly one album recommendation per calendar day. Two different visitors see (in general) different albums on the same day. The same visitor sees the same album all day, and a different one the next day.

This is a portfolio/learning project: small in scope, no backend, no accounts.

## Requirements

- A visitor gets exactly one album per local calendar day.
- Different visitors generally see different albums on the same day.
- No login or account system.
- No external/live music API — album data is a static, hand-curated list bundled with the app.
- No guarantee against repeats over time (a visitor may see the same album again on a later day).
- Web only, no native app.

## Out of scope

- User accounts / login (any form)
- Live external music APIs (Spotify, Last.fm, etc.)
- Avoiding repeat recommendations over time
- Social features (sharing, favoriting, comments, history of past picks)
- Admin/curation tooling — the album list is a static file, edited by hand
- Native/mobile app

## Architecture

Pure static frontend, no backend:

- **Stack**: Vite + vanilla TypeScript. No UI framework — the page has a single piece of dynamic content (today's album), which doesn't warrant component-based tooling.
- **Hosting**: GitHub Pages, built via a GitHub Actions workflow that runs `vite build` and publishes the output.
- **Data**: a static JSON file bundled into the build (see [Album data](#album-data)).
- All selection logic runs client-side, in the browser, at page load.

## Visitor identity

- On first visit, if no identity cookie exists, generate one with `crypto.randomUUID()`.
- Store it in a cookie with a long expiry (~2 years).
- If the cookie is ever missing (cleared, new browser, etc.), silently generate a new one and treat the visitor as new — no error state.
- No server-side storage of identities; the cookie is the entire identity mechanism.

## Album data

Static JSON file bundled with the app, curated by hand. Each entry:

```json
{
  "title": "In Rainbows",
  "artist": "Radiohead",
  "year": 2007,
  "coverArtUrl": "https://example.com/cover.jpg"
}
```

- No `listenUrl` field yet — planned as a future addition, not part of this spec.
- Target size: roughly 200 albums — large enough that a given visitor rarely notices an obvious short-cycle repeat, small enough to hand-curate for a portfolio piece.

## Selection algorithm

Deterministic, stateless — no database, no server round-trip.

1. Determine "today" as the visitor's **local calendar date** (e.g. `2026-07-13`), computed client-side from `new Date()`. The recommendation rolls over at local midnight, not a fixed UTC instant.
2. Build a seed string: `` `${visitorId}-${todayDateString}` ``.
3. Hash the seed with a small, hand-rolled non-cryptographic string hash (e.g. FNV-1a). No external hashing library — cryptographic strength isn't needed.
4. `index = hash(seed) % albums.length`.
5. Render `albums[index]` as today's recommendation.

This is fully deterministic: the same visitor + the same date always yields the same index, and different visitor IDs are expected to spread reasonably evenly across the list.

## UI

Single page, centered card layout (validated against a throwaway prototype — see `prototype/daily-album-ui` branch, not part of `main`):

- A short eyebrow label (e.g. "Today's Pick").
- Square cover art.
- Album title, artist, and year below the art.
- No navigation, no other routes, no history of past picks — one focused "here's your album for today" moment.

## Open follow-ups (not part of this spec)

- Adding a `listenUrl` field and rendering it as an outbound link.
- Growing or refining the curated album list over time (manual, no tooling).
