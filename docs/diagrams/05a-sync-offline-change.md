# Sync: an offline change

A change made offline on the phone: queued in the outbox, sent on reconnect, and arriving on the desktop through live updates.

```mermaid
sequenceDiagram
  actor You
  participant Local as Phone: IndexedDB
  participant Sync as Phone: PocketBaseSync
  participant PB as PocketBase
  participant Other as Desktop: sync and IndexedDB

  Note over You,Sync: Offline
  You->>Local: Save: record with a new changed_at,<br/>outbox entry, in one transaction
  Local-->>You: Screen updates, Today shows "Offline, 1 waiting"
  Local->>Sync: Outbox hook calls push()
  Sync-->>Sync: Offline, so nothing is sent

  Note over You,Sync: Reconnect
  Sync->>Sync: online event calls sync()
  Sync->>PB: Refresh the token if past half its life
  Sync->>PB: Pull all 8 collections: updated >= cursor, 500 a page
  PB-->>Local: Records merged, newest changed_at wins
  Sync->>PB: Ask which records are still soft-deleted
  Sync->>Local: Drop purged records, unless still in the outbox
  Sync->>PB: Subscribe to live updates (SSE) on all 8

  loop Outbox, oldest first
    Sync->>PB: PATCH the record (POST if that gives 404)
    PB-->>Local: Saved record merged
    Sync->>Local: Remove the entry, unless it changed meanwhile
  end
  Sync->>PB: Photo removals, then uploads once the note has left the outbox

  PB-->>Other: Live update over SSE
  Other->>Other: Merge by changed_at, screen updates
```

- Status 0, 429 or 5xx counts as offline and retries in 30 seconds; 401 or 403 [ends the session](06b-expired-token.md); any other refusal drops that outbox entry and logs it.
- A device that missed the live update catches up on its next pull, at start, on reconnect or with Settings › Sync now.
- Offline and sync 1 in the build plan says SQLite on Android; decision 16 and the code use IndexedDB (Dexie) everywhere.
