# TODO

The overall checklist, in build order. Each line names the rules (R…) and tests (T…) from `docs/build-plan.md` it serves, and points to its plan in `docs/plans/` once written. Tick a line in the same commit as the work that finishes it.

## Phase 1: Foundations (`v0.1-foundations`, done when T9 passes)

- [x] Phase 1 plans written and committed (`docs/plans/1-*.md`)
- [ ] Repo layout: one Angular app, a Capacitor shell, a Tauri shell; top-level README (`1-repo-layout`)
- [x] Design tokens as a code file, fonts, base styles (`1-design-tokens`)
- [ ] PocketBase schema and migrations for the eight collections, version pinned (`1-pocketbase`)
- [ ] Single account with email and password sign-in, no sign-up (`1-pocketbase`; decision 8, open question Sign-in)
- [ ] Docker Compose for development with seed data matching the screens, plus a reset command (`1-docker`)
- [ ] Docker Compose for production on the Pi (arm64): PocketBase, nightly backup job, tunnel container slot (`1-docker`)
- [ ] Local copy, outbox, pull since last sync, live updates, newest change wins, soft deletes (`1-sync`; Offline and sync 1–6)
- [ ] "Offline, N waiting" status (`1-sync`; Offline and sync 7)
- [ ] Capacitor Android shell running the app (`1-shells`)
- [ ] Tauri desktop shell running the app (`1-shells`)
- [ ] CI: unit and end-to-end tests on every push; Windows app and APK built on phase tags (`1-ci`)
- [ ] Service READMEs: app, Android, desktop, PocketBase, deployment (`1-repo-layout` and each service's plan)
- [ ] T9 passes: a todo made offline appears on the other device after reconnecting

## Phase 2: Capture, Inbox, Today (`v0.2-capture`, done when T1–T8 pass)

- [ ] Phase 2 plans written and committed
- [ ] Shared components: ListRow, TodoRow, GroupBox, ListLabel, Button, Sheet, Toast, BottomNav, SegmentedControl, EmptyState, SwipeRow
- [ ] Capture sheet: todo and quick note, from the + button; lands in the Inbox (R1, R2; T3)
- [ ] Add details for a todo: date, time, end time, reminder, list, Event switch (R4; T4)
- [ ] Android share sheet makes a quick note in the Inbox (R1, R3; T5)
- [ ] Inbox: badge, Today and Earlier sections, Inbox zero (R15, R16; T3)
- [ ] Inbox quick note actions: Keep, Make todo, Archive (R17; T6)
- [ ] Inbox swipes on todos and quick notes, Move to (R18; T7)
- [ ] Today: Scheduled and Anytime, next-up card, done/total pill (R5, R6, R11, R12; T1)
- [ ] Ticking, the toast with Add note and Undo, "N done" fold (R7, R25; T2)
- [ ] Left over and Pick for today (R8, R9; T8)
- [ ] Welcome, First Today, set up groups and lists
- [ ] T1–T8 pass

## Phase 3: Lists and notes (`v0.3-lists`, done when T10–T11 pass)

- [ ] Phase 3 plans written and committed
- [ ] Lists screen with groups opening and closing, counts on closed groups (R22)
- [ ] New list inside a group, New group, Edit lists and groups (R23; T10)
- [ ] A list's Todos and Notes tabs, empty list, List settings, archive a list
- [ ] Todo detail with steps (data model `steps`)
- [ ] Notes with markdown body and photos from camera or files, full-size view (R24; T11)
- [ ] Links between todos and notes, both ways, Link picker (R25)
- [ ] Move to
- [ ] T10–T11 pass

## Phase 4: Repeating, events, calendars (`v0.4-repeating`, done when T12–T14 pass)

- [ ] Phase 4 plans written and committed
- [ ] Repeating roughly: days since, red past target, Just count days (R19; T12)
- [ ] Repeating on a schedule: next due day, red after a missed day (R20; T13)
- [ ] Repeat row and Stop repeating, completions kept (R21)
- [ ] Today's Repeating section, ticking adds a completion (R10; T12)
- [ ] Event detail, Event label everywhere (R12)
- [ ] Calendar import on the phone, Settings → Calendars, read-only (R13, R14; T14)
- [ ] Reminders as Android notifications
- [ ] T12–T14 pass

## Phase 5: Agenda, This week, Search, Archive (`v0.5-agenda`, done when T15 passes)

- [ ] Phase 5 plans written and committed
- [ ] Agenda: week strip, month view, choose month and year, empty-day folding (R28)
- [ ] This week (R29)
- [ ] Search with All, Todos and Notes filters, link into Archive search (R30)
- [ ] Archive and Done, Restore, Not done, closed lists (R26)
- [ ] Recently deleted: days left, Restore, Empty now, purge after 30 days (R27; T15)
- [ ] Settings screen
- [ ] T15 passes

## Phase 6: Desktop (`v0.6-desktop`, done when T16 passes)

- [ ] Phase 6 plans written and committed
- [ ] Sidebar layout and desktop versions of every screen
- [ ] Ctrl+Space global capture window, tray icon (R1, R2; T16)
- [ ] Desktop keyboard shortcuts screen
- [ ] T16 passes
