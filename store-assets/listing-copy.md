# Chrome Web Store — listing copy & assets

Everything the publish step (#17) pastes/uploads for the **Broken Record**
listing. Tone: clean & minimal.

## Name

```
Broken Record
```

## Short description (max 132 chars)

```
A hand-picked album on every new tab, with the page themed to its cover art. A fresh pick each day — no sign-in, no tracking.
```

## Detailed description

```
One album a day, every new tab.

Broken Record replaces your new tab page with a single hand-picked album
recommendation, with the whole page colored to match the album's cover art.
Open a new tab, get one record worth your time — then a new one tomorrow.

• A new, hand-picked album every day
• The page themes itself to the album's cover art
• The same pick stays put all day, across every new tab you open
• Private by design — no accounts, no analytics, nothing leaves your device

Just open a new tab.
```

## Category & language

- **Category:** suggested — *Art & Design* or *Fun* (pick at submission).
- **Language:** English (US).

## Assets inventory

| Asset | Spec | File |
| --- | --- | --- |
| Store icon | 128×128 PNG | `extension/icons/icon128.png` (source: `store-assets/icon.svg`) |
| Screenshot 1 | 1280×800 PNG | `store-assets/screenshots/screenshot1.png` — A Love Supreme (red-orange theme) |
| Screenshot 2 | 1280×800 PNG | `store-assets/screenshots/screenshot2.png` — Pet Sounds (green theme) |
| Screenshot 3 | 1280×800 PNG | `store-assets/screenshots/screenshot3.png` — Hounds of Love (purple theme) |
| Small promo tile (optional) | 440×280 PNG | `store-assets/promo-tile.png` (source: `store-assets/promo-tile.svg`) |

The three screenshots deliberately span distinct hues to show the cover-driven
theming — the extension's defining feature.

## Regenerating

- Icon: rasterize `store-assets/icon.svg` to 16/48/128 with sharp → `extension/icons/`.
- Screenshots: rendered from the real page markup + bundled colors via headless
  Chrome at 1280×800 (see #16 resolution for the harness).
- Privacy policy URL and data disclosures live separately in
  `docs/chrome-web-store-privacy.md`.
