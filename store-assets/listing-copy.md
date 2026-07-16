# Chrome Web Store — listing copy & assets

Everything the publish step (#17) pastes/uploads for the **Broken Record**
listing. Tone: clean & minimal.

## Name

```
Broken Record
```

## Short description (max 132 chars)

```
A new tab, a new record — one hand-picked album a day, dressed in the colors of its cover. On repeat, minus tracking.
```

## Detailed description

```
Your new tab has great taste.

Broken Record hands you one hand-picked album every day and themes the whole
page to its cover art — a tiny detour into something worth hearing, every time
you open a tab. One record today, another tomorrow.

• One carefully chosen album a day — no endless feed
• The page takes on the album's colors
• Same pick all day, across every tab
• Private by design — no sign-in, no tracking

Less scrolling. More listening.
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
