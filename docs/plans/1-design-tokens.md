# 1 · Design tokens as code

**Goal:** every colour, size, radius, spacing and shadow from `docs/design-system/tokens.json` is a CSS custom property, generated from the JSON so the two never drift.

**Covers:** design system README (Color, Type, Layout).

## Approach

- `app/scripts/tokens.mjs` reads `docs/design-system/tokens.json` and writes `app/src/styles/_tokens.scss` with `:root { --bg: …; --space-4: …; --radius-row: …; }`, plus one class per type style (`.t-display`, `.t-row`, …).
- `npm run tokens` regenerates it; a unit test fails when the generated file is stale.
- Space Grotesk and Inter are bundled from `@fontsource` packages, so they load offline inside the shells. Tabular figures on numbers.
- `styles.scss`: `bg` ground, `ink` text, `--font-ui` for the interface.

## Steps

- [x] Token generator and generated SCSS
- [x] Global styles and fonts
- [x] Staleness test

## Done when

The app background is `#F1F2F6` in `--font-ui`, and changing `tokens.json` without running `npm run tokens` fails the test.
