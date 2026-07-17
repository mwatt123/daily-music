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

Broken Record gives you one hand-picked album each day and themes the whole
page to its cover art — a small detour into something worth hearing, every time
you open a tab. Keep the ones you love in a personal crate, and play any of them
with a tap. One record today, another tomorrow.

• One carefully chosen album a day — no endless feed
• The page takes on the album's colors
• Keep favorites in an on-device crate — private, no account
• Listen to today's pick, or anything in your crate
• Same pick all day, across every tab

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

Screenshots 1–3 deliberately span distinct hues to show the cover-driven
theming — a defining feature — while surfacing the Listen and Keep controls;
screenshot 2 catches an album already in the crate, and screenshot 4 shows the
crate itself, the collection those keeps build up. Both promo tiles use the same
device: a "today's pick" cover card (a vinyl in a colored sleeve, title/artist
as placeholder bars) floating on a five-hue spectrum, echoing how the new-tab
page takes on each cover's colors. The marquee fans out three picks with
distinct sleeve/label colors to show the daily variety.

## Regenerating

- Icon: rasterize `store-assets/icon.svg` to 16/48/128 with sharp → `extension/icons/`.
- Screenshots: four 1280×800 captures of the real running app (the shared Shelf)
  via headless Chrome — a seeded visitor id fixes each daily pick and a seeded
  `dailyAlbum.crate` blob populates the crate (three daily-pick hues plus the
  crate wall).
- Privacy policy URL and data disclosures live separately in
  `docs/chrome-web-store-privacy.md`.
