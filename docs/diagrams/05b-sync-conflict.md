# Sync: conflicts

What happens when both devices changed the same record while offline: the later `changed_at` wins the whole record, with no prompt.

```mermaid
sequenceDiagram
  participant A as Phone (changed_at 100)
  participant PB as PocketBase
  participant B as Desktop (changed_at 200)

  alt The later change reaches the server first
    B->>PB: PATCH, changed_at 200
    A->>PB: Reconnect: pull
    PB-->>A: Record at 200, not older than local 100
    A->>A: Local copy replaced by 200, outbox entry stays
    A->>PB: PATCH the local copy, now 200: no change in effect
  else The earlier change reaches the server first
    A->>PB: PATCH, changed_at 100
    PB-->>B: Live update or pull: record at 100
    B->>B: Older than local 200, so kept (photos, files and file names still taken from the server)
    B->>PB: PATCH, changed_at 200
    PB-->>A: Live update: record at 200 replaces 100
  else An older PATCH arrives after the pull
    A->>PB: PATCH, changed_at 100, stored is 200
    PB-->>A: sync.pb.js ignores it and answers 200 with the stored record
    A->>A: Stored record replaces the local copy
  end
```

- The build plan (Offline and sync 4) says the later `updated` wins. The code uses `changed_at`, set by the device's clock, so a wrong clock can lose or win a conflict.
- The whole record wins; fields are not merged. Photos are the exception: they only ever come from the server.
- The build plan's open question stands: the SyncConflict screen isn't built.
