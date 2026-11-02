# App

The Angular app behind both the Android and desktop apps: every screen, the local copy and the sync with PocketBase. Under 900px wide it's the phone layout, from 900px the desktop layout.

Diagrams: [code layers](../docs/diagrams/03a-code-layers.md), [sync](../docs/diagrams/05a-sync-offline-change.md), [sign-in](../docs/diagrams/06a-sign-in.md), [screens](../docs/diagrams/09a-screens-phone.md).

## Run

From WSL, in `app/`. Install packages from WSL only; never run npm on the Windows side.

| Command                                         | What it does                                                                                                |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `npm start`                                     | Dev server on http://localhost:4200 (the dev Compose file runs it for you)                                  |
| `npm test`                                      | Unit tests                                                                                                  |
| `npm run e2e`                                   | End-to-end tests against a throwaway PocketBase on port 8091                                                |
| `npm run e2e:docker`                            | The same inside Playwright's Docker image, for WSL without Chromium's libraries                             |
| `VISUAL=1 npm run e2e:docker -- visual.spec.ts` | Compares every screen with screenshots; add `--update-snapshots` on the commit to compare with to take them |
| `npm run lint`                                  | ESLint, layer boundaries, design tokens and Prettier                                                        |
| `npm run tokens`                                | Regenerates `src/styles/_tokens.scss` from `docs/design-system/tokens.json`                                 |
| `npm run diagrams`                              | Regenerates the Angular dependency diagrams in `docs/diagrams/` from the real imports                       |

In production the app runs inside the shells, which package the web files:

| Command                                   | What it does                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| `npm run build`                           | Production web files in `dist/app/browser`                                     |
| `npm run build:android` / `build:desktop` | Web build, then the debug APK or the Windows installer (see the shell READMEs) |

## Config

| Setting                  | Where                                                                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| PocketBase address       | The sign-in screen, kept on the device. Before that, `DEFAULT_SERVER_URL` in `src/app/core/server/server.ts` (`http://localhost:8090`) |
| `VISUAL`                 | Set to run `e2e/visual.spec.ts`, which is otherwise skipped                                                                            |
| `E2E_POCKETBASE_RUNNING` | Set by `e2e:docker`: Playwright then doesn't start its own PocketBase                                                                  |

## Talks to

PocketBase over HTTPS: REST for reads and writes, server-sent events for live updates. On Android it runs inside [Capacitor](android/README.md), on desktop inside [Tauri](../desktop/README.md).
