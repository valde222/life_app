# 1 · PocketBase schema and sign-in

**Goal:** the eight collections from the data model, as migrations, in a pinned PocketBase image; one account signs in with email and password.

**Covers:** data model, decisions 5 and 8, open question Sign-in (email and password).

## Schema

All collections: client-made 15-character id, `created` / `updated` autodates, `changed_at` (number, client ms) and `deleted_at` (date). `changed_at` is how "newest change wins" is judged; `updated` is the pull cursor. `deleted_at` on every collection (not only todos and notes) so deletes of steps, lists or groups reach the other device.

| Collection | Fields beyond the common ones |
| --- | --- |
| `groups` | name, order |
| `lists` | name, group → groups, colour (select of 7), order, archived_at |
| `todos` | title, list → lists, inbox, date, time, time_end, is_event, repeat_mode (none, rough, schedule), repeat_every_days, repeat_every_weeks, repeat_weekdays (json), reminder, done_at, archived_at |
| `steps` | todo → todos, text, done, order |
| `completions` | todo → todos, done_on |
| `notes` | title, body (markdown text), list → lists, inbox, photos (file, many, thumbs 200x200 and 800x0), todos → todos (many), archived_at |
| `calendar_events` | calendar, external_id, title, start, end, all_day, synced_at |
| `settings` | calendars (json) |

Dates (`date`) are `YYYY-MM-DD` text and times `HH:MM` text: they are local days and clock times, not instants.

## Rules

- Every collection: list, view, create, update, delete need `@request.auth.id != ""`.
- `users`: no sign-up (`createRule` null). The one account comes from `PB_USER_EMAIL` / `PB_USER_PASSWORD` on start (hook), as does the superuser (`PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD`).
- Hook: an update whose `changed_at` is older than the stored one is ignored (the stored record is returned), so the later change wins wherever it arrives from.

## Steps

- [x] Dockerfile pinning v0.40.4 (amd64 and arm64)
- [x] Migration creating the collections
- [x] Hooks: account bootstrap, newest-change-wins
- [x] Seed script (dev only) with the canvas data
- [x] `pocketbase/README.md`

## Done when

`docker compose -f docker-compose.dev.yml up` gives a PocketBase whose admin UI shows the eight collections, sign-in works with the dev account, and an older `changed_at` update leaves the record unchanged (tested).
