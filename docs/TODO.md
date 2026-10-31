# TODO

The overall checklist, in build order. Each line names the rules (R…) and tests (T…) from `docs/build-plan.md` it serves, and points to its plan in `docs/plans/` once written. Tick a line in the same commit as the work that finishes it.

## Phase 1: Foundations (`v0.1-foundations`, done when T9 passes)

- [x] Phase 1 plans written and committed (`docs/plans/1-*.md`)
- [x] Repo layout: one Angular app, a Capacitor shell, a Tauri shell; top-level README (`1-repo-layout`)
- [x] Design tokens as a code file, fonts, base styles (`1-design-tokens`)
- [x] PocketBase schema and migrations for the eight collections, version pinned (`1-pocketbase`)
- [x] Single account with email and password sign-in, no sign-up (`1-pocketbase`; decision 8, open question Sign-in)
- [x] Docker Compose for development with seed data matching the screens, plus a reset command (`1-docker`)
- [x] Docker Compose for production on the Pi (arm64): PocketBase, nightly backup job, tunnel container slot (`1-docker`)
- [x] Local copy, outbox, pull since last sync, live updates, newest change wins, soft deletes (`1-sync`; Offline and sync 1–6)
- [x] "Offline, N waiting" status (`1-sync`; Offline and sync 7)
- [x] Capacitor Android shell running the app (`1-shells`)
- [x] Tauri desktop shell running the app (`1-shells`)
- [x] CI: unit and end-to-end tests on every push; Windows app and APK built on phase tags (`1-ci`)
- [x] Service READMEs: app, Android, desktop, PocketBase, deployment (`1-repo-layout` and each service's plan)
- [x] T9 passes: a todo made offline appears on the other device after reconnecting

## Phase 2: Capture, Inbox, Today (`v0.2-capture`, done when T1–T8 pass)

- [x] Phase 2 plans written and committed (`docs/plans/2-*.md`)
- [x] Shared components: TodoRow, ListLabel, Button, Sheet, Toast, BottomNav, SegmentedControl, EmptyState, SwipeRow (`2-ui-kit`)
- [x] Capture sheet: todo and quick note, from the + button; lands in the Inbox (R1, R2; T3; `2-capture`)
- [x] Add details for a todo: date, time, end time, reminder, list, Event switch (R4; T4; `2-capture`)
- [x] Android share sheet makes a quick note in the Inbox (R1, R3; T5; `2-share-sheet`)
- [x] Inbox: badge, Today and Earlier sections, Inbox zero (R15, R16; T3; `2-inbox`)
- [x] Inbox quick note actions: Keep, Make todo, Archive (R17; T6; `2-inbox`)
- [x] Inbox swipes on todos and quick notes, Move to (R18; T7; `2-inbox`)
- [x] Today: Scheduled and Anytime, next-up card, done/total pill (R5, R6, R11, R12; T1; `2-today`)
- [x] Ticking, the toast with Add note and Undo, "N done" fold (R7, R25; T2; `2-today`)
- [x] Left over and Pick for today (R8, R9; T8; `2-today`)
- [x] Welcome, First Today, set up groups and lists (`2-first-launch`)
- [x] T1–T8 pass

## Phase 3: Lists and notes (`v0.3-lists`, done when T10–T11 pass)

- [x] Phase 3 plans written and committed (`docs/plans/3-*.md`)
- [x] Lists screen with groups opening and closing, counts on closed groups (R22; `3-lists`)
- [x] New list inside a group, New group, Edit lists and groups (R23; T10; `3-lists`)
- [x] A list's Todos and Notes tabs, empty list, List settings, archive a list (`3-lists`)
- [x] Todo detail with steps (data model `steps`; built with the todo editor in phase 2)
- [x] Notes with markdown body and photos from camera or files, full-size view (R24; T11; `3-notes`)
- [x] Links between todos and notes, and between notes, both ways, Link picker (R25; `3-notes`)
- [x] Move to (built in phase 2)
- [x] T10–T11 pass

## Phase 4: Repeating, events, calendars (`v0.4-repeating`, done when T12–T14 pass)

- [x] Phase 4 plans written and committed (`docs/plans/4-*.md`)
- [x] Repeating roughly: days since, red past target, Just count days (R19; T12; `4-repeating`)
- [x] Repeating on a schedule: next due day, red after a missed day (R20; T13; `4-repeating`)
- [x] Repeat row and Stop repeating, completions kept (R21; `4-repeating`)
- [x] Today's Repeating section, ticking adds a completion (R10; T12; `4-repeating`)
- [x] Event detail, Event label everywhere (R12; `4-events-calendars`)
- [x] Calendar import on the phone, Settings → Calendars, read-only (R13, R14; T14; `4-events-calendars`)
- [x] Reminders as Android notifications (`4-events-calendars`)
- [x] T12–T14 pass

## Phase 5: Agenda, This week, Search, Archive (`v0.5-agenda`, done when T15 passes)

- [x] Phase 5 plans written and committed (`docs/plans/5-agenda-week-search-archive.md`)
- [x] Agenda: week strip, month view, choose month and year, empty-day folding (R28)
- [x] This week (R29)
- [x] Search with All, Todos and Notes filters, link into Archive search (R30)
- [x] Archive and Done, Restore, Not done, closed lists (R26)
- [x] Recently deleted: days left, Restore, Empty now, purge after 30 days (R27; T15)
- [x] Settings screen
- [x] T15 passes

## Phase 6: Desktop (`v0.6-desktop`, done when T16 passes)

- [x] Phase 6 plans written and committed (`docs/plans/6-desktop.md`)
- [x] Sidebar layout and desktop versions of every screen
- [x] Ctrl+Space global capture window, tray icon (R1, R2; T16)
- [x] Desktop keyboard shortcuts screen
- [x] T16 passes

## Security audit (`v0.7-security`)

- [x] Security audit: every check in `docs/plans/security-audit.md` done, findings fixed, `docs/security.md` written

## Refactor (`refactor/clean-code`, pull request)

- [x] Clean, modular structure with enforced boundaries and lint, behaviour and UI unchanged (`docs/plans/refactor.md`)

## Polish

- [x] Ticking a todo shows the tick, then the row slides out (R7; `docs/plans/tick-animation.md`)
- [ ] Micro-interactions on the everyday moments: ticking, toasts, adding, Inbox, swipes, sheets and more (`docs/plans/animations.md`)
