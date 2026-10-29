# PocketBase

The backend: one PocketBase (v0.40.4, pinned in the `Dockerfile`) holding the one account, the eight collections and the photos.

## What's here

| Path | What it is |
| --- | --- |
| `Dockerfile` | Pinned PocketBase for amd64 and arm64; applies migrations and creates the superuser on start |
| `pb_migrations/` | The schema: `groups`, `lists`, `todos`, `steps`, `completions`, `notes` (with `links` to other notes, and private `photos`), `calendar_events`, `settings` |
| `pb_hooks/account.pb.js` | Creates or updates the one account from the environment on start. Sign-up is off |
| `pb_hooks/sync.pb.js` | Newest change wins: an update older than the stored `changed_at` is ignored. Purges records deleted more than 30 days ago, nightly at 04:15 |
| `seed/seed.mjs` | Development data matching the design canvas, dated relative to today. Does nothing if data exists |
| `tests/` | API tests (`node --test tests/*.test.mjs`) |

Every record carries a client-made id, `changed_at` (the device's clock, in ms) and `deleted_at` (soft delete), plus PocketBase's `created` and `updated`. Apps pull changes by `updated`. Note photos are protected files: the apps fetch them with a short-lived file token.

## Run

Use the Compose files at the repo root; the dev one starts this with seed data. The admin UI is at http://localhost:8090/_/.

## Environment

| Variable | Use |
| --- | --- |
| `PB_USER_EMAIL`, `PB_USER_PASSWORD` | The one account the apps sign in with |
| `PB_ADMIN_EMAIL`, `PB_ADMIN_PASSWORD` | Superuser for the admin UI and backups |

## Talks to

Nothing. The apps and the backup job talk to it.
