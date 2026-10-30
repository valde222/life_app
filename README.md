# Life

A personal todo, notes and repeating-chores app for one person: an Android app and a desktop app, both from one Angular codebase, backed by a self-hosted PocketBase on a Raspberry Pi.

## How the pieces fit

| Piece | Folder | Notes |
| --- | --- | --- |
| Angular app | `app/` | Every screen, the local copy and sync. [README](app/README.md) |
| Android shell | `app/android/` | Capacitor wrapper, share sheet, calendars. [README](app/android/README.md) |
| Desktop shell | `desktop/` | Tauri wrapper, tray icon, Ctrl+Space capture. [README](desktop/README.md) |
| Backend | `pocketbase/` | Schema, hooks, seed data. [README](pocketbase/README.md) |
| Deployment | `deploy/`, `docker-compose.yml` | The Pi: PocketBase, nightly backups, tunnel. [README](deploy/README.md) |

Each app keeps a local copy of everything and an outbox of changes, so it works offline; it syncs with PocketBase over HTTPS when it can.

## Start the dev environment

From WSL, in the repo folder:

```sh
docker compose -f docker-compose.dev.yml up
```

Then open http://localhost:4200 and sign in with `me@example.com` / `lifeapp-dev`. The data matches the design canvas, dated around today. PocketBase's admin UI is at http://localhost:8090/_/ (`admin@example.com` / `lifeapp-admin`).

The seed is dated around the day it first ran. To throw the data away and reseed for today: `./scripts/dev-reset.sh`. After pulling new code, recreate the containers (`docker compose -f docker-compose.dev.yml up -d --force-recreate`) so the dev server and PocketBase pick it up.

## Docs

`docs/build-plan.md` is the brief, `docs/TODO.md` the checklist, `docs/plans/` one plan per feature, `docs/screens/` and `docs/design-system/` the look.
