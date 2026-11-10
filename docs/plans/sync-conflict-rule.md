# Sync conflict rule

When both devices change the same record, the change that reaches the server last wins: the later `updated` time, as Offline and sync 4 in the build plan says. Until now the code compared `changed_at`, the device's clock at the moment of the change. Branch `fix/sync-conflict-rule`, tagged `v1.1.1`.

Decided with Valdemar: follow the build plan (question 1 in the bug sweep report).

## Behaviour

- **Server:** every update is saved. The `sync.pb.js` hook no longer ignores an update with an older `changed_at`.
- **Device, receiving a record** (pull, live update or the answer to its own send):
  - No unsent change to that record here: the server's record replaces the local copy.
  - An unsent change is waiting in the outbox: the local copy stays (photos, files and file names still come from the server), because it will reach the server later and win there.
  - The server's record is the local version itself coming back (same `changed_at`): it replaces the local copy, which picks up `created` and `updated`.
- The whole record wins; fields aren't merged. No prompt, so the SyncConflict screen stays unbuilt.
- `changed_at` stays: lists sort by it, and the outbox uses it to tell whether a record changed while it was being sent.

## Example

The phone edits a todo offline yesterday; the desktop edits it today. When the phone reconnects, its edit is sent last, so it wins on both devices. Before this change the desktop's edit won, because its clock was later.

## Steps

- [x] Plan
- [x] Server: the hook saves every update; the API test says so
- [ ] App: `applyRemote` keeps a local copy only while it has an unsent change; unit tests
- [ ] Docs: conflict diagram, data model diagram, PocketBase README, build plan, bug sweep report, deploy checklist (v1.1.1, update test on 1.1.2)
- [ ] Tests and lint pass; merge to `main`; tag `v1.1.1`
