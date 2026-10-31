# Refactor: clean, modular, easy to change

Make the code easier to change without changing what the app does or how it looks. Rollback point: tag `pre-refactor` on `main`. Branch: `refactor/clean-code`. Every commit is one refactoring (`refactor: …`), tests pass after each one, and bugs found on the way go in the list at the bottom and are fixed separately afterwards, each with a test. To resume, continue from the first unticked box.

## Safety net

- 78 unit tests (pure rules, sync, local store, server client), 33 PocketBase API tests, 20 end-to-end tests (T1–T16), 8 Android JUnit tests.
- Gaps: no tests on `Actions`, `Repository`, `Store`, `SyncService`, `Photos`, `CalendarImporter`, or any component. Characterisation tests for the services come first (step 1), and the components are covered by a visual test: every screen, mobile and desktop, with a fixed clock and fixed data, compared pixel for pixel against screenshots taken on `pre-refactor` (`e2e/visual.spec.ts`).

## What's there now

One Angular app with 24 flat folders under `src/app` (agenda, archive, calendar, capture, data, desktop, inbox, layout, lists, note, pickers, reminders, repeating, search, server, settings, setup, share, sign-in, sync, time, today, todo, ui, week), a 91-line Tauri `lib.rs`, three Android classes, five PocketBase hooks and three migrations, Compose files and three workflows. Already good: standalone components, signals and OnPush on 56 of 58 components, business rules mostly in pure tested functions (`today-items`, `repeat-status`, `inbox-items`…), one generic local-first repository, no `any`.

## Problems, by impact

1. **No layers, and features import each other.** The flat folders mix data access, UI kit and screens. Features reach into each other: Agenda and Today into `calendar` and `repeating`, Archive into `search`, Lists into `capture` and `note`, Todo into `note`, Settings into `archive` and `calendar`, and the data layer into `lists`. Nothing stops a new one.
2. **Components do data access and know about PocketBase.**
   - `Today` and `SettingsPage` read the email off `server.pb.authStore`.
   - `SignIn` calls `LocalStore.adopt` and `Server` in sequence.
   - The route guard counts Dexie tables.
   - `CalendarImporter` and `Photos` use the Dexie store directly.
   - Twelve components call `Repository.save`/`remove` with hand-built field sets.
   - Edits that belong together live in components: a group's delete cascade in `ManageLists`, link toggling in `TodoEditor`, step handling in `TodoEditor`, restore and purge in the archive pages.
3. **Business rules in components.**
   - `Today`: the overdue repeating list, the "all done" rule and step counts.
   - `TodoEditor`: the time label and back names.
   - `NoteEditor`: back names and the date label.
   - `ArchivePage` and `DeletedPage`: grouping by day.
4. **Duplication.**
   - Three copies of the "back to" label map.
   - Three copies of opening the link picker and of the date picker.
   - Two copies of "Moved to …" toasts and of "write a note for this todo".
   - Two archive pages watching the same three tables.
   - `localDate(new Date(ts.replace(' ', 'T')))` in four places.
   - The collection list repeated in three PocketBase hooks and two test files.
5. **Concrete dependencies.**
   - `Repository` and `SyncService` are concrete classes everything injects.
   - Sync, outbox and conflict handling have no single interface.
   - `Server` exposes the raw SDK (`pb`) as a mutable public field.
6. **Errors and logging are scattered:** five `console.error` calls in four files, and silent `catch {}` blocks.
7. **No lint or format gate.** Prettier is installed but not run. There is no ESLint, `strict` is implicit, and there are non-null assertions without reasons. `app.ts` and `sign-in.ts` are not OnPush.
8. **Rust shell:**
   - one file for hotkey, tray and windows;
   - three `expect`s at runtime;
   - window errors thrown away with `let _ =`;
   - no tests.
9. **Styling:** colours are all tokens, but spacing and radius values are mostly literal pixel values, a third of them off the token scale (2, 6, 10 and 14 px come straight from the screen markup), and font sizes repeat the type scale by hand.
10. **Smaller:** CI and the e2e script start PocketBase three different ways. The backup and PocketBase Dockerfiles each pin Alpine on their own. The Android share plugin mixes intent parsing with plugin plumbing.

## Target architecture

```
src/app/
  domain/      pure TypeScript: models, ids, time, and the rules (today, inbox, repeating, events, lists, search, archive, week, agenda, calendar import, share)
  core/        Angular services with no UI: data (local store, repositories, store, actions), sync, server, session, photos, calendar, reminders, share, platform, logging
  shared/      design-system components, pickers and sheets used by several features, markdown
  features/    today, inbox, lists, notes, todos, repeating, agenda, week, search, archive, settings, capture, setup, sign-in
  shell/       app root, routes, main layout, sidebar, detail pane, shortcuts
```

Dependency rules, enforced by dependency-cruiser in CI:

- `domain` imports only `domain`: no Angular, Dexie, PocketBase or RxJS.
- `core` imports `core` and `domain`.
- `shared` imports `shared`, `core` and `domain`.
- A feature imports itself, `shared`, `core` and `domain`, never another feature.
- `shell` may import anything; nothing imports `shell`.
- Only `core/data`, `core/sync` and `core/server` import `dexie` or `pocketbase`.
- No circular imports.

Inside a feature, the page (container) injects services and holds state, and presentational components take inputs and emit outputs. Data access goes through `Repository` (an abstract class used as an interface, with the local-first implementation provided in `app.config.ts`) and the task-named methods on `Actions`. Sync, outbox and conflict handling sit behind `Sync`.

Rust: `tray.rs`, `hotkey.rs`, `windows.rs`, `error.rs`, with `lib.rs` only wiring them. No custom commands are added (none exist and the app needs none). Errors are typed, there's no `unwrap` or `expect` outside tests, and menu handling is a tested pure function.

## Steps

### 0. Plan

- [x] This plan, and a `TODO.md` line

### 1. Safety net

- [ ] Visual test of every screen (mobile and desktop); baseline taken on `pre-refactor`
- [ ] Characterisation tests: `Repository`, `Actions`, `Store`
- [ ] Characterisation tests: `SyncService` (pull, prune, live updates, failure handling), `Photos`, `CalendarImporter`

### 2. Tooling

- [ ] `strict` explicit in `tsconfig.json`, plus `noUncheckedIndexedAccess`; fix what it finds without changing behaviour
- [ ] ESLint with angular-eslint and typescript-eslint strict, plus limits on function length, complexity, parameters and nesting; fix what it finds
- [ ] Prettier check over the app and e2e
- [ ] Stylelint: colours, spacing, radius and font sizes from tokens only
- [ ] dependency-cruiser with the rules above (run in report mode until step 3 is done)
- [ ] `npm run lint` running all of them, in CI

### 3. Angular layers (one move per commit, imports updated, no code changes)

- [ ] `domain/`: models, ids, time and the pure rules
- [ ] `core/`: data, sync, server, photos, calendar, reminders, share, platform
- [ ] `shared/`: UI kit, pickers, link picker, move to, item actions, capture sheet, repeat row, markdown
- [ ] `features/`: one folder per feature
- [ ] `shell/`: root, routes, layout
- [ ] Boundary rules switched to error

### 4. Angular code

- [ ] One logger, used everywhere, with no silent catches
- [ ] `Repository` and `Sync` as interfaces; `Server` hides the SDK
- [ ] `Session`: sign in, sign out and the account email; no component touches `Server` or `LocalStore`
- [ ] Setup guard and calendar import through repository methods, not Dexie
- [ ] Data edits moved out of components into `Actions` (steps, links, lists, groups, restore, purge)
- [ ] Rules moved out of components into `domain` (overdue repeating, all done, step counts, labels, grouping by day)
- [ ] Duplicates merged: back labels, link picker, date picker, toasts, the note for a todo, timestamp to day
- [ ] OnPush on the last two components; non-null assertions removed or given a reason
- [ ] Long components split into a page and presentational parts where it clears the lint limits (todo editor, note editor)
- [ ] Styles use tokens only (extend the token file with the off-scale values the screens use)

### 5. Rust, Android, PocketBase, Docker, CI

- [ ] Tauri: modules, typed errors, no `expect`, tested menu handling; rustfmt and clippy `-D warnings` in CI
- [ ] Android: share intent parsing split from the plugin; tests kept
- [ ] PocketBase: one list of synced collections for the hooks and tests; hooks tidied
- [ ] Docker and CI: one way to start the test PocketBase; shared steps deduplicated

### 6. Finish

- [ ] All tests pass, lint is clean, desktop and Android build
- [ ] READMEs updated to the new structure
- [ ] Summary below
- [ ] Pull request opened (not merged)

## Bugs found (fixed separately afterwards)

None yet.

## Summary

To be written at the end.
