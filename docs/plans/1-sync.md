# 1 · Local copy and outbox

**Goal:** screens read a local copy; writes go to the local copy at once and to an outbox; the outbox drains to PocketBase in order; changes from elsewhere come back by pull and live updates; the newest change wins.

**Covers:** Offline and sync 1–7, decision 6, T9.

## Design

- **Local store:** IndexedDB through Dexie, on every platform (Android WebView, Tauri WebView, browser). One code path, testable in Playwright. The plan named SQLite on Android; Capacitor's WebView keeps IndexedDB in app data, which isn't evicted, so IndexedDB is enough for one user's data. Logged as decision 16. The store sits behind a `LocalStore` interface so SQLite can be swapped in if it disappoints.
- **Records:** every write stamps `changed_at = Date.now()`; ids come from the client (15 chars, PocketBase's alphabet).
- **Outbox:** a Dexie table of `{seq, collection, id, op: upsert|delete}`. Draining reads the current local record, so several edits collapse to one send. Upsert = update, or create when it's 404. Delete = upsert with `deleted_at`. Network errors stop the drain and retry on reconnect or after a backoff.
- **Pull:** on start and on reconnect, per collection, `updated > cursor`, paged; a pulled record replaces the local one only if its `changed_at` is not older. The cursor is the largest `updated` seen.
- **Live:** `subscribe('*')` per collection while online, through the same merge.
- **Status:** a `SyncService` exposes `online` and `waiting` (outbox length) signals. Today shows "Offline, N waiting" (phase 2 builds Today; phase 1 shows it in the shell).
- **Purge:** records with `deleted_at` older than 30 days are deleted for good by a PocketBase cron hook (R27 lands in phase 5; the cron is here).

## Steps

- [ ] `LocalStore` with Dexie, ids, `changed_at`
- [ ] Outbox and drain
- [ ] Pull with cursor, live subscriptions, merge rule
- [ ] Online/offline detection and status signals
- [ ] Sign-in screen (email and password) and auth persistence
- [ ] A minimal todo screen to exercise it (replaced in phase 2)
- [ ] Unit tests for merge, outbox collapse, cursor
- [ ] Playwright T9: two browser contexts on test PocketBase; one offline creates a todo and shows "Offline, 1 waiting"; after reconnecting the other sees it

## Done when

T9 passes in CI.
