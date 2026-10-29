# Life app: build plan

Oct 29, 2026 · @Valdemar

## How to use this doc

This is the brief for the AI that writes the code. Valdemar makes the architecture and stack decisions and reviews each phase by using the build; he doesn't write or read code.

- **What the app looks like:** the Design canvas (every screen, clickable) and the Design System (tokens, components, writing rules). Screens match the canvas; values come only from the design system.
- **What it does:** the data model and behaviour rules below. When a screen and a rule disagree, the rule wins and the disagreement goes in Open questions.
- **What's decided:** the decision log. Read it before every task and don't reverse a decision without asking.
- **How work is accepted:** the whole app is built in one run. Each phase ends with its acceptance tests passing, a merge and a tag; Valdemar tests whenever he chooses and redirects through comments.
- **Background:** the planning doc holds every design decision and why it was made.

## How the code is written

Five rules apply to every task, from the first commit.

### Git: small, frequent commits

- One logical change per commit, committed as soon as it works and its tests pass. Never mix a refactor with a feature in one commit.
- Messages say what changed and why, in conventional form: `feat: swipe right on an inbox todo puts it on Today (R18)`. Reference the rule or test it serves.
- `main` always builds and runs. Each phase is a branch merged by pull request.
- Each accepted phase gets a tag (`v0.1-foundations`, `v0.2-capture`, …), so rolling back is checking out a tag.
- A `.gitignore` from the first commit, kept up to date as tools are added: dependencies, build output, caches, PocketBase data and backups, local config and secrets, editor and OS files, built installers. Commit `.env.example`, never `.env`. Check `git status` before every commit so nothing unintended goes in.

### Documentation: written with the code, at service level

- Docs change in the same commit as the code they describe. A pull request without its doc update isn't done.
- One short README per service: the Angular app, the Android shell, the desktop shell, PocketBase, deployment. Each covers what it does, how to run it, its config and environment variables, and what it talks to.
- A top-level README says how the pieces fit and how to start the dev environment. No code-level documentation.
- Concise: if a section is longer than a screen, it's describing code instead of the service.

### Docker: Compose for production and development

- **Production:** one `docker-compose.yml` runs everything on the Pi (arm64 images): PocketBase, the nightly backup job, the Angular web build if the work PC needs it, and the tunnel container once that's decided.
- **Development:** `docker compose -f docker-compose.dev.yml up` starts PocketBase with seed data matching the canvas (Lunch with sister, Clean bathroom 9 days, and so on) and the Angular dev server with live reload. One more command resets the seed data. Valdemar can spin it up and test without reading code.

### Code comments: almost never

- If code needs a comment to explain what it does, rewrite the code instead: clearer names, smaller functions.
- The only allowed comment is a why the code can't say, such as a platform quirk or a workaround, with a link to the source.

### Planning: todo documents before code

The repo carries its own plan, so any new session can pick up where the last one stopped, for example after running out of usage, with no help from Valdemar.

- **Before any code:** write `docs/TODO.md`, the overall checklist of every phase and feature in this doc, in build order, each line naming its rules and tests.
- **Before each feature:** write `docs/plans/<phase>-<feature>.md` with the goal, the rules and tests it covers, the services and files it touches, the steps as a checklist, and what done means. Code starts only once the plan is written and committed.
- **While building:** tick the step in the plan and the line in `TODO.md` in the same commit as the work. A decision taken along the way goes into the plan and, if it's architectural, the decision log.
- **Resuming:** a new session reads the top-level README, then `TODO.md`, then the plan for the first unticked line, then the latest commits, and continues from the first unticked step. To restart, Valdemar only says: "Read docs/TODO.md and continue."

## Decision log

The app is one Angular codebase, wrapped by Capacitor on Android and Tauri on desktop, talking to a self-hosted PocketBase on a Raspberry Pi. What mattered most, in order: photos, relational data, maturity, open source; then simple hosting. Offline is nice to have, because Valdemar is rarely offline.

&#91;embedded content: architecture · two apps, one server\]

Each app keeps its own copy and talks to PocketBase over HTTPS; how the Pi gets its public address is still open.

| # | Decision | Why | Rejected |
| --- | --- | --- | --- |
| 1 | Android phone plus a desktop app; no iOS | The phone Valdemar uses | iOS for now |
| 2 | Angular + TypeScript for all UI: standalone components, signals | Used daily at work; keeps code clean; one codebase for phone and desktop | React Native / Expo (not a fan of React), NativeScript (small community, no good sync story), Flutter (Dart) |
| 3 | Capacitor for the Android app | Keeps Angular; maintained plugins for the share sheet and for reading calendars | Tauri on Android (thin plugin ecosystem, all native parts custom), installable web app (no calendar access or widget) |
| 4 | Tauri 2 for the desktop app, Rust for the native parts | Small and fast; global capture hotkey and tray icon | Electron (heavy) |
| 5 | PocketBase as the backend, self-hosted, version pinned | Open source (MIT); one binary; SQLite with relation fields; file fields with thumbnails for photos; login, admin UI and live updates built in | PowerSync (server is source-available under FSL, beta labels), self-hosted Supabase (around a dozen containers), CouchDB (documents, not relational). Fallback if PocketBase disappoints: Postgres + a small Rust API |
| 6 | Online first, with a local cache and an outbox; newest change wins | Rarely offline, one user, so conflicts are rare; far simpler than a sync engine | A full local-first sync engine |
| 7 | Hosted on a Raspberry Pi at home | Just one user; cheap; data stays home | Managed cloud |
| 8 | One account, no sign-up | Single user | Multi-user features |
| 9 | Calendars sync one way: the phone reads its calendars and writes those events into PocketBase; the desktop shows them from there | No Google or Outlook connection on desktop | Two-way sync; events made in the app stay in the app |
| 10 | Open source repo: apps, PocketBase schema and migrations, deploy script | Anyone can run their own copy | Closed source |
| 11 | Nightly backup of the PocketBase data folder to a second place | Self-hosting means owning data loss | None |
| 12 | Docker Compose for deployment on the Pi and for a one-command dev environment with seed data | Easy to deploy, update and roll back; Valdemar can spin up the app and test it himself | Running binaries directly with systemd |
| 13 | Small, frequent commits; a tag per accepted phase; docs written with the code at service level; almost no code comments | Easy rollbacks and a readable history; code that explains itself | Large commits, docs written afterwards, comments explaining code |
| 14 | An overall todo list and a plan per feature live in the repo, written before the code and ticked off as work lands | Well-planned features; any new session resumes from the first unticked step with no help | Planning in the chat only, which is lost when a session ends |
| 15 | The repo lives on the Windows drive. Git, Docker, Node and the Angular build run in WSL; Rust/Tauri and the Android SDK run on Windows, called from WSL through cmd.exe. GitHub Actions also builds the Windows app and the APK on every phase tag for a release. Valdemar deploys to the Pi | Uses each tool where it's already installed; a repo on the Windows drive is reachable from both sides. Windows needs no Node: WSL builds the web files, and Tauri and Gradle only package them | Cross-compiling Windows builds from WSL; building on the Windows side by hand |
| 16 | The local copy is IndexedDB (Dexie) on every platform, behind a `LocalStore` interface | One code path for Android, desktop and tests; Capacitor's WebView storage isn't evicted | SQLite on Android only (two implementations to keep in step) |

## Data model

Eight PocketBase collections. A todo, an event and a repeating item are one `todos` collection with flags, because the app turns one into another (Event switch, Repeat row, Stop repeating). Every record gets a client-made id so it can be created offline, and PocketBase's own `created` and `updated` times.

&#91;embedded content: data model · 8 collections\]

Arrows point from one to many. A todo or note with no list sits in the Inbox.

| Collection | Fields | Notes |
| --- | --- | --- |
| `groups` | name, order | Life, Work, Hobbies |
| `lists` | name, group → groups, colour (blue, purple, teal, green, orange, pink, grey), order, archived\_at | Archiving a list moves it to Archive › Closed lists |
| `todos` | title, list → lists (empty = Inbox), inbox (bool), date, time, time\_end, is\_event (bool), repeat\_mode (none, rough, schedule), repeat\_every\_days, repeat\_every\_weeks, repeat\_weekdays, reminder, done\_at, archived\_at, deleted\_at | Event = `is_event`. Repeating item = `repeat_mode` not none |
| `steps` | todo → todos, text, done (bool), order | Only on todos that aren't events |
| `completions` | todo → todos, done\_on (date) | History of a repeating item: Done on, days since |
| `notes` | title, body (markdown), list → lists (empty = none), inbox (bool), photos (file, many, thumbnails), todos → todos (many), archived\_at, deleted\_at | A quick note is a note with `inbox` on. Links to todos work both ways through the `todos` field and its back-relation |
| `calendar_events` | calendar, external\_id, title, start, end, all\_day, synced\_at | Written only by the phone, from its calendars. Read-only in the app |
| `settings` | one record: enabled calendars | Settings → Calendars |

Repeat values from the screens: Every few days = 3 days, Weekly = 7, Every 2 weeks = 14, Monthly = 30, Just count days = no target. On a schedule = every 1, 2 or 4 weeks on chosen weekdays.

## Behaviour rules

Each rule is written so a test can check it. Numbers are stable: tests and pull requests refer to them ("R12").

### Capture

1. **R1** Capture opens from the + button, the Android share sheet and the desktop hotkey (Ctrl+Space). The home-screen widget comes in version 2.
2. **R2** Anything captured without a list lands in the Inbox (`inbox` on).
3. **R3** Shared text, links and photos from other apps become a quick note in the Inbox.
4. **R4** Turning on Event in Add details makes the item an event: no checkbox, no steps, and the sheet title reads "New event". The end time is optional.

### Today

1. **R5** Today shows items dated today that aren't done. Items with a time go under Scheduled, sorted by time; the rest under Anytime.
2. **R6** The next-up card shows the next timed item still to come, with "in 1h 20m". It adds "until 13:00" only when an end time is set.
3. **R7** Ticking a todo sets `done_at` and shows the toast "\<title> done" with Add note (a new note already linked to the todo) and Undo. Done items fold into "N done" at the bottom.
4. **R8** A todo dated before today and not done is left over. It doesn't show on Today; it counts in "+ Pick for today, N left over". Pick for today opens on Left over when there are any.
5. **R9** Picking an item for today sets its date to today.
6. **R10** Today's Repeating section shows only overdue repeating items. Ticking one adds a completion for today.
7. **R11** The "done / total" pill counts today's items and opens This week.

### Events and calendars

1. **R12** Events, from the app or from a calendar, show an "Event" label instead of the list label and never have a checkbox.
2. **R13** The phone writes events from the calendars enabled in Settings into `calendar_events`. Nothing is written back to any calendar.
3. **R14** Calendar events are read-only in the app.

### Inbox

1. **R15** The Inbox badge shows the number of Inbox items, on phone and desktop.
2. **R16** Inbox items are split into Today and Earlier by when they were captured.
3. **R17** Quick note actions: Keep opens Keep note, and Save there takes it out of the Inbox (with a list if one was picked). Make todo turns it into a todo. Archive archives it.
4. **R18** Swiping a todo right puts it on Today; swiping left opens Move to. Swiping a quick note right keeps it; left archives it. Either way it leaves the Inbox.

### Repeating

1. **R19** A roughly repeating item shows days since its last completion. Its tag turns red once days since passes the target. "Just count days" never turns red.
2. **R20** A scheduled item shows its next due day ("Thu"). It turns red the day after a due day that wasn't done.
3. **R21** The Repeat row on a todo makes it repeating. Stop repeating turns it back into a todo with the list and date picked there; its completions are kept.

### Lists and notes

1. **R22** Groups open and close on Lists. A closed group shows "N lists, M todos"; an open one shows no count.
2. **R23** "+ New list" inside a group creates the list in that group without asking.
3. **R24** A note can hold photos from the camera or files. Photos open full size.
4. **R25** Linking a todo and a note shows the link on both.

### Archive, done and delete

1. **R26** Archive lists archived items by day, with Restore, and closed lists. Done lists done todos, with Not done.
2. **R27** Delete moves an item to Recently deleted for 30 days, showing days left. After 30 days, or on Empty now, it's removed for good.

### Agenda, This week and Search

1. **R28** Agenda's week strip and month view show a dot on days with items. Runs of empty days fold into one line.
2. **R29** This week shows things done and notes written Monday to Sunday, a bar per day, and what was finished.
3. **R30** Search covers todo titles and note titles and bodies, with filters All, Todos and Notes, and a link into Archive search.

## Offline and sync

The app works against PocketBase when online and keeps working on a local copy when not. The newest change to a record wins, which is safe for a single user.

1. **Local copy.** Each device keeps a copy of all records in local storage: SQLite on Android (Capacitor community SQLite), IndexedDB or SQLite on desktop. Screens read from the local copy, never straight from the network.
2. **Writes.** A change is written to the local copy at once and added to an outbox. The outbox sends changes to PocketBase in order whenever there's a connection.
3. **Reads.** On start and on reconnect, the app pulls every record with `updated` later than its last pull. While online, PocketBase's live updates keep the copy current.
4. **Conflicts.** If the same record changed on two devices, the change with the later `updated` time wins.
5. **Deletes.** Records are soft-deleted (`deleted_at`) so other devices learn about them; Recently deleted purges them after 30 days.
6. **Photos.** A photo taken offline is kept locally and uploaded with its note when the outbox runs. Thumbnails come from PocketBase.
7. **Status.** When offline, Today shows "Offline, N waiting" (the Offline screen). Nothing else changes.

Test this in phase 1, before any feature work builds on it: create and edit on the phone in flight mode, reconnect, and check the desktop.

## Build phases

Six phases, built back to back in one run. The phases are the AI's order of work and its checkpoints: each ends with its acceptance tests passing, a merge to main and a tag, then the next starts straight away. Stop and ask only when a decision can't be made from this doc and a wrong guess would be costly to undo; otherwise pick the most reasonable option, add it to the decision log, and carry on.

1. **Foundations.** The overall todo list and the phase 1 plans, written first. Repo layout (one Angular app, a Capacitor shell, a Tauri shell), PocketBase schema and migrations, Docker Compose for the Pi and the dev environment with seed data, public HTTPS and nightly backups, service READMEs, design tokens as a code file, CI running the tests, the local copy and outbox. Done when a record made on the phone in flight mode shows up in the desktop shell after reconnecting.
2. **Capture, Inbox, Today.** Capture sheet (todo and quick note), Add details, the Android share sheet, Inbox sorting and swipes, Today with ticking, the toast, left over and Pick for today. Done when T1 to T8 pass.
3. **Lists and notes.** Groups and lists, a list's Todos and Notes tabs, todo detail with steps, notes with photos, links both ways, Move to, List settings.
4. **Repeating, events, calendars.** Repeating items roughly and on a schedule, Today's Repeating section, the Event switch, calendar import on the phone.
5. **Agenda, This week, Search, Archive.** Week strip and month, This week, search with filters, Archive, Done and Recently deleted.
6. **Desktop.** Tauri app with the sidebar layout, Ctrl+Space capture, tray icon, the desktop versions of every screen.

Parked for version 2: dark mode, the home-screen widget, the lock-screen view.

## Acceptance tests

The click-through walkthroughs from the planning doc, rewritten so they can be automated (end-to-end tests on the Angular app against a test PocketBase). A phase is done when its tests pass.

| ID | Given | When | Then | Rules | Phase |
| --- | --- | --- | --- | --- | --- |
| T1 | Today has Lunch with sister (event, 12:00) and Call the landlord (todo, 17:00) | Today opens at 10:40 | Lunch is the next-up card with "in 1h 20m" and an Event label, no checkbox; Call the landlord has a checkbox under Scheduled | R5, R6, R12 | 2 |
| T2 | Pay taxes is on Today | Tick it | Toast "Pay taxes done"; Add note opens a new note linked to Pay taxes; Undo brings the todo back | R7, R25 | 2 |
| T3 | Nothing open | + → type "buy butter" → Save | "buy butter" is in the Inbox under Today and the badge goes up by one | R2, R15, R16 | 2 |
| T4 | A todo with Add details open | Turn on Event | Checkbox and Steps disappear; the title reads "New event"; saved, it shows an Event label | R4, R12 | 2 |
| T5 | Another app shares a link | Pick the app in the share sheet | A quick note with the link is in the Inbox | R3 | 2 |
| T6 | "Wall is 312 cm" is a quick note in the Inbox | Keep → add to Apartment → Save | It leaves the Inbox and is a note in Apartment | R17 | 2 |
| T7 | "buy butter" is a todo in the Inbox | Swipe right | It's on Today and out of the Inbox | R18, R9 | 2 |
| T8 | Two todos dated yesterday, not done | Open Today, then + Pick for today | Today shows "2 left over"; Pick opens on Left over; picking one dates it today | R8, R9 | 2 |
| T9 | Phone in flight mode | Create a todo, then reconnect | The todo appears on the desktop; Today showed "Offline, 1 waiting" while offline | Offline and sync | 1 |
| T10 | On Lists, the Life group is open | + New list → "Garden" → Create list | Garden is in Life; the sheet never asked for a group | R23 | 3 |
| T11 | A note in Client A | + Photo → pick two photos | Both show as thumbnails and open full size; they survive a reload on the other device | R24 | 3 |
| T12 | Clean bathroom repeats weekly, last done 9 days ago | Open Today | It's under Repeating with a red "9 days"; ticking it resets it to 0 and removes it from Today | R10, R19 | 4 |
| T13 | Water plants repeats every Mon and Thu; it's Tuesday | Open Repeating | It shows "Thu"; on Friday, if not done, it's red | R20 | 4 |
| T14 | The Personal calendar is enabled in Settings | The phone syncs | Its events show on the phone and desktop with an Event label and can't be edited | R13, R14 | 4 |
| T15 | A note was deleted 3 days ago | Open Archive → Recently deleted | It shows "27 days left"; Restore brings it back; Empty now removes everything | R27 | 5 |
| T16 | Desktop app running in the background | Press Ctrl+Space anywhere | The capture window opens; Save puts the item in the Inbox | R1, R2 | 6 |

## Open questions

Nine things to settle. The first three are best answered before the build starts; for the rest, the AI takes the suggested option, logs it and carries on.

- [ ] **Public address for the Pi.** The work PC can't run Tailscale, so the Pi needs public HTTPS: Cloudflare Tunnel or Tailscale Funnel? *Leaning Tailscale Funnel; final call at deployment. Keep the tunnel a swappable container.*
- [x] **Apps on the work PC.** Can you install the Tauri app there? If not, the Pi also serves the Angular app as a website for the browser at work. *Yes: the Tauri app is installed there; the Pi serves no web build.*
- [x] **Sign-in.** The First launch screens say "Continue with Apple". For one user on PocketBase, email and password is simplest; Google is the other option. *Email and password.*
- [ ] **Where backups go:** a second disk, another machine, or a cloud bucket?
- [ ] **Calendar window:** how far back and ahead the phone imports, for example 2 weeks back and 3 months ahead.
- [ ] **Past events on Today:** do they stay, fade, or disappear once their time has passed?
- [ ] **Reminders in v1:** Android notifications only, or desktop too?
- [x] **Repo name and license.** MIT would match PocketBase. *Taken: MIT; the repo is `life-app`.*
- [x] **Walkthroughs in the planning doc** still mention the Calendar label and "All 5"; update them to the current screens.
