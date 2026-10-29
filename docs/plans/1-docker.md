# 1 · Docker Compose

**Goal:** one command starts the dev environment with seed data; one file runs production on the Pi.

**Covers:** decision 12, build plan Docker rule, decision 11 (nightly backup).

## Development (`docker-compose.dev.yml`)

- `pocketbase`: built from `pocketbase/`, data in the named volume `pb_dev_data` (not a bind mount; `/mnt/c` is slow), migrations and hooks bind-mounted, port 8090.
- `seed`: one-shot Node container that signs in and writes the canvas data when the database is empty.
- `app`: Node container running `ng serve` with polling (`/mnt/c` doesn't deliver file events), port 4200, `node_modules` in a named volume.
- Reset: `docker compose -f docker-compose.dev.yml down -v && docker compose -f docker-compose.dev.yml up` (wrapped as `./scripts/dev-reset.sh`).

## Production (`docker-compose.yml`)

- `pocketbase` (arm64 image), data in `./data/pb_data`, restart always.
- `backup`: small Alpine container with cron, nightly at 03:30: PocketBase's backup API writes a zip, which is copied to `BACKUP_TARGET` (a mounted folder; where it points is still an open question) and pruned after 14 days.
- `tunnel`: Tailscale Funnel container (Valdemar's leaning), behind a Compose profile so it only starts once configured. No web build: the work PC runs the Tauri app.
- `.env.example` lists every variable.

## Steps

- [x] Dev compose with seed and reset
- [x] Production compose, backup job, tunnel profile
- [x] `deploy/README.md`

## Done when

`docker compose -f docker-compose.dev.yml up` serves the app on http://localhost:4200 signed in against seeded PocketBase, and `docker compose config` validates the production file.
