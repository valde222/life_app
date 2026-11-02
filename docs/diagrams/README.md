# Diagrams

How the app works, drawn from the code. `scripts/check-diagrams.sh` renders them all, and CI runs it. `npm run diagrams` in `app/` regenerates 03a to 03e.

1. [System overview](01-system-overview.md): the phone, desktop, Pi and GitHub, and the protocols between them.
2. [Production deployment](02a-deployment-production.md): the Compose services, mounts, network and ports on the Pi.
3. [Dev environment](02b-deployment-dev.md): the same for the dev Compose file.
4. [Code layers](03a-code-layers.md): which Angular layers import which, counted from the real imports.
5. [Features to shared](03b-features-to-shared.md): the shared UI modules each feature uses.
6. [Features to core](03c-features-to-core.md): the core services each feature uses.
7. [Inside core](03d-inside-core.md): how the modules in `core` import each other.
8. [Shared to core](03e-shared-to-core.md): what the modules in `shared` import.
9. [Tauri modules](03f-tauri-modules.md): the desktop shell's Rust modules and plugins.
10. [Android native parts](03g-android-native.md): the Android shell's Java classes and plugins.
11. [Data model](04-data-model.md): every PocketBase collection, its main fields and relations.
12. [Sync: an offline change](05a-sync-offline-change.md): from the outbox to the other device.
13. [Sync: conflicts](05b-sync-conflict.md): what happens when both devices changed a record.
14. [Sign-in](06a-sign-in.md): logging in and token refresh.
15. [Expired token](06b-expired-token.md): back to sign-in, and what happens to unsent changes.
16. [Todo lifecycle](07a-todo-lifecycle.md): open, done, archived, deleted, restored.
17. [Open todo states](07b-todo-open-states.md): Inbox, a list, dated, Today, left over.
18. [Quick note lifecycle](07c-note-lifecycle.md): Inbox, kept, made into a todo, archived.
19. [Repeating item lifecycle](07d-repeating-lifecycle.md): on track, overdue, ticked, stopped.
20. [Capture](08-capture.md): every way something gets into the app, and where it lands.
21. [Phone screen map](09a-screens-phone.md): the screens under 900px wide.
22. [Detail screens](09b-screens-details.md): which screens open a todo, note, event or repeat editor.
23. [Desktop screen map](09c-screens-desktop.md): the screens from 900px wide, and the capture window.
24. [CI/CD](10-ci-cd.md): what runs on a push, pull request, tag and schedule, and what each produces.
