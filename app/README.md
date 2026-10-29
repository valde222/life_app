# App

The Angular app behind both the Android and desktop apps: every screen, the local copy and the sync with PocketBase.

## Run

From WSL, in `app/`:

| Command | What it does |
| --- | --- |
| `npm start` | Dev server on http://localhost:4200 (the dev Compose file runs it for you) |
| `npm test` | Unit tests (Vitest) |
| `npm run e2e` | End-to-end tests (Playwright) against a test PocketBase |
| `npm run build` | Production web files in `dist/app/browser`, used by both shells |
| `npm run tokens` | Regenerates `src/styles/_tokens.scss` from `docs/design-system/tokens.json` |

Install packages from WSL only; never run npm on the Windows side.

## Config

- PocketBase address: `src/environments/` holds the default; the sign-in screen can change it, and the choice is kept on the device.

## Talks to

PocketBase over HTTPS (REST for reads and writes, server-sent events for live updates). On Android it runs inside Capacitor (`android/`), on desktop inside Tauri (`../desktop`).
