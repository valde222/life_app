# App

The Angular app behind both the Android and desktop apps: every screen, the local copy and the sync with PocketBase.

## Run

From WSL, in `app/`:

| Command                                   | What it does                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| `npm start`                               | Dev server on http://localhost:4200 (the dev Compose file runs it for you)      |
| `npm test`                                | Unit tests (Vitest)                                                             |
| `npm run e2e`                             | End-to-end tests (Playwright) against a throwaway PocketBase on port 8091       |
| `npm run e2e:docker`                      | The same inside Playwright's Docker image, for WSL without Chromium's libraries |
| `npm run build`                           | Production web files in `dist/app/browser`, used by both shells                 |
| `npm run build:android` / `build:desktop` | Web build, then the APK or Windows installer (see the shell READMEs)            |
| `npm run tokens`                          | Regenerates `src/styles/_tokens.scss` from `docs/design-system/tokens.json`     |

Install packages from WSL only; never run npm on the Windows side.

## Config

- PocketBase address: `DEFAULT_SERVER_URL` in `src/app/server/server.ts` (`http://localhost:8090`); the sign-in screen changes it, and the choice is kept on the device.

## Security

- `src/index.html` carries a Content Security Policy: scripts only from the app itself, no inline scripts or event handlers, network and images only over HTTPS (plain HTTP only to `localhost`, `127.0.0.1` and the emulator's `10.0.2.2`). Critical-CSS inlining is off in the production build because it relies on an inline `onload` handler. `e2e/security.spec.ts` checks the policy blocks injected scripts and nothing the app does.
- Note markdown is rendered by a tokenizer that escapes every piece of text; `markdown.spec.ts` checks no input can produce tags or attributes outside a short allowlist.

## Layouts

Under 900px wide it's the phone layout with the bottom nav; from 900px the desktop layout: sidebar, content, and a detail pane for todos, notes and events. Same routes, same components.

## Data

Screens read the local copy (IndexedDB, `src/app/data/`), never the network. Every write goes to the local copy and an outbox; `src/app/sync/` sends the outbox in order, pulls changes since the last pull, listens for live updates, and keeps whichever change has the later `changed_at`.

## Talks to

PocketBase over HTTPS (REST for reads and writes, server-sent events for live updates). On Android it runs inside Capacitor (`android/`), on desktop inside Tauri (`../desktop`).
