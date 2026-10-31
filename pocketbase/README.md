# PocketBase

The backend: one PocketBase (v0.40.4, pinned in the `Dockerfile`) holding the one account, the eight collections and the photos.

## What's here

| Path | What it is |
| --- | --- |
| `Dockerfile` | PocketBase for amd64 and arm64, pinned by version and SHA-256, on a digest-pinned Alpine; runs as uid 10001. Applies migrations on start; `--automigrate=false`, so the schema only changes through the migrations here |
| `pb_migrations/` | The schema: `groups`, `lists`, `todos`, `steps`, `completions`, `notes` (with `links` to other notes, and private `photos`), `calendar_events`, `settings` |
| `pb_hooks/account.pb.js` | Creates or updates the one account and the superuser from the environment on start (never on a command line). With `PB_ENV=production` it refuses passwords under 16 characters or the example values. Sign-up is off |
| `pb_hooks/owner.pb.js` | Stamps `owner` with the signed-in account on every create. Every rule is "a user, and the owner is you" (decision 18); the owner can't be changed and accounts can't delete themselves |
| `pb_hooks/public_access.pb.js` | Refuses the admin UI, superuser sign-in and any superuser request that came through a proxy (the public tunnel). Superusers work only from the Pi itself |
| `pb_hooks/settings.pb.js` | On every start: rate limits on (5 sign-ins a minute per client), client address taken from the tunnel's `X-Forwarded-For` |
| `pb_hooks/collections.js` | The eight synced collections, shared by the hooks (migrations keep their own lists) |
| `pb_hooks/sync.pb.js` | Newest change wins: an update older than the stored `changed_at` is ignored. Purges records deleted more than 30 days ago, nightly at 04:15 |
| `seed/seed.mjs` | Development data matching the design canvas, dated relative to today. Does nothing if data exists |
| `tests/` | API tests, including `access.test.mjs`, which attacks every collection signed out, with expired and forged tokens, as a second account and as a superuser through the public address. Run against a running server with `PB_URL`, `PB_USER_*` and `PB_ADMIN_*` set: `node --test --test-concurrency=1 tests/*.test.mjs`. `tests/start-server.sh <name> <port>` starts a throwaway, hardened server for this, CI and the end-to-end tests |

Every record carries a client-made id, `changed_at` (the device's clock, in ms) and `deleted_at` (soft delete), plus PocketBase's `created` and `updated`. Apps pull changes by `updated`. Note photos are protected files: the apps fetch them with a short-lived file token.

## Run

Use the Compose files at the repo root; the dev one starts this with seed data. The admin UI is at http://localhost:8090/_/.

## Environment

| Variable | Use |
| --- | --- |
| `PB_USER_EMAIL`, `PB_USER_PASSWORD` | The one account the apps sign in with |
| `PB_ADMIN_EMAIL`, `PB_ADMIN_PASSWORD` | Superuser for the admin UI and backups |
| `PB_ENV` | `production` on the Pi: turns on the password check |
| `PB_RATE_LIMITS` | `off` only for the end-to-end test server, which signs in dozens of times a minute. Never set in production |

## Talks to

Nothing. The apps and the backup job talk to it.
