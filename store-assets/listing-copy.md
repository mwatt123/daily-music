# Chrome Web Store — listing copy & assets

Everything the publish step (#17) pastes/uploads for the **Broken Record**
listing. Tone: clean & minimal.

## Name

```
Broken Record
```

## Short description (max 132 chars)

```
A new tab, a new record — one hand-picked album a day, dressed in the colors of its cover.
```

## Detailed description

```
One record a day, every new tab.

One hand-picked album each day, with the whole page themed to its cover. Keep
the ones you love in a personal crate, and play any of them with a tap.

• One album a day — no endless feed
• Keep favorites in an on-device crate
• Listen to today's pick, or anything you've kept

Less scrolling. More listening.
```

## Category & language

- **Category:** suggested — *Art & Design* or *Fun* (pick at submission).
- **Language:** English (US).

## Assets inventory

| Asset | Spec | File |
| --- | --- | --- |
| Store icon | 128×128 PNG | `extension/icons/icon128.png` (source: `store-assets/icon.svg`) |
| Screenshot 1 | 1280×800 PNG | `store-assets/screenshots/screenshot1.png` — On Fire (orange theme); daily pick with Listen + Keep |
| Screenshot 2 | 1280×800 PNG | `store-assets/screenshots/screenshot2.png` — Buhloone Mindstate (teal theme); an album already kept (Undo shown) |
| Screenshot 3 | 1280×800 PNG | `store-assets/screenshots/screenshot3.png` — New Amerykah Part Two (indigo theme); daily pick with Listen + Keep |
| Screenshot 4 | 1280×800 PNG | `store-assets/screenshots/screenshot4.png` — the crate: a wall of kept records, each with Listen + Remove |
| Small promo tile (optional) | 440×280 PNG | `store-assets/promo-tile.png` (source: `store-assets/promo-tile.svg`) |
| Marquee promo tile (optional) | 1400×560 PNG | `store-assets/marquee-tile.png` (source: `store-assets/marquee-tile.svg`) |

Screenshots 1–3 span distinct hues to show the cover-driven theming and the
Listen + Keep controls (2 shows an album already kept); screenshot 4 shows the
crate. Both promo tiles float a "today's pick" cover card on a five-hue
spectrum, echoing the cover-driven colors; the marquee fans out three picks to
show the daily variety.

## Regenerating

- Icon: rasterize `store-assets/icon.svg` to 16/48/128 with sharp → `extension/icons/`.
- Screenshots: four 1280×800 captures of the real running app (the shared Shelf)
  via headless Chrome — a seeded visitor id fixes each daily pick and a seeded
  `dailyAlbum.crate` blob populates the crate (three daily-pick hues plus the
  crate wall).
- Privacy policy URL and data disclosures live separately in
  `docs/chrome-web-store-privacy.md`.
