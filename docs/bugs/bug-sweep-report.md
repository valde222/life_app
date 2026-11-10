# Bug sweep report

The sweep checked the app against `docs/build-plan.md` (R1–R30, T1–T16, the offline and sync rules), following the checklist in `docs/plans/bug-sweep.md`. Branch `fix/bug-sweep`. Each bug was reproduced, given a failing test and fixed in its own commit.

**How the bugs were found**
- Reading every rule against its code.
- A new crawl of every screen and sheet at phone and desktop size that fails on any console error or failed request (`e2e/crawl.spec.ts`). It found nothing.
- A long-content check that no screen scrolls sideways (`e2e/long-content.spec.ts`).
- Fake-clock tests across midnight.
- Date tests across both DST changes, month and year ends and leap years. They found nothing, and the tests stay.
- Static checks: TypeScript, ESLint, the boundary and token checks, clippy, and listeners and timers. All clean.

**Results**
- 174 unit tests, 38 end-to-end tests and 10 Android tests pass.
- Every screen is unchanged in the exact screenshot comparison, apart from invisible text smoothing in list labels (bug 11).
- Lint and clippy are clean, both apps build, and the desktop release starts.

## Bugs fixed

Severity: **data loss**, **crash** (or the app closing), **wrong behaviour**, **cosmetic**.

| # | Bug | Severity | Where | Fix | Test |
| --- | --- | --- | --- | --- | --- |
| 1 | Pressing an item with the mouse and dragging off left it looking pressed | cosmetic | global pressed style | `313edb7` | `e2e/pressed-state.spec.ts` |
| 2 | Android's back button closed the app on every screen and with a sheet open, losing an unsaved new todo or note (Capacitor's App plugin, which handles back, wasn't installed) | crash | `core/platform/back-button.ts` | `4ea94b4` | `back-button.spec.ts` |
| 3 | Restoring a todo or note whose list had been deleted put it back in that list, so it showed nowhere but Search (R26, R27) | data loss | `ArchiveActions` | `3f5fc0c` | `archive-actions.spec.ts` |
| 4 | Restoring a list whose group had been deleted left it on neither Lists nor the sidebar (R27) | data loss | `ArchiveActions` | `e455d96` | `archive-actions.spec.ts` |
| 5 | The done button on Repeating added a new completion on every press, so This week counted a chore twice and "usually every N days" was skewed (R10, R19) | wrong behaviour (duplicate data) | `Actions.complete` | `36e4cd1` | `actions.spec.ts` |
| 6 | A login that expired mid-session signed out silently: the screen stayed, changes queued and the sidebar still said Synced until a restart (sync 7) | wrong behaviour | app root, `Server.expire` | `10c91a2`, refined in `3f8a2f0` | `e2e/expired-login.spec.ts` |
| 7 | List and group counts included chores, which a list page doesn't show, so "2 todos" could open onto one (R22) | wrong behaviour | `domain/list-counts.ts` | `a00a5de` | `list-counts.spec.ts` |
| 8 | Events in the Inbox and Search got a tick box. This came from the tick-everywhere fix the day before (R12) | wrong behaviour | Inbox, Search | `bd1d130` | `e2e/tick-everywhere.spec.ts` |
| 9 | An event running past midnight (23:00 to 01:00) showed as ended all evening (R6) | wrong behaviour | `hasEnded` | `32f552e` | `calendar-items.spec.ts` |
| 10 | Agenda, This week, Archive and Recently deleted kept yesterday's date when left open past midnight; This week stayed on last week into Monday (R27–R29) | wrong behaviour | those four screens | `fc7a840` | `e2e/midnight.spec.ts` |
| 11 | A long unbroken list name (a pasted URL, say) made Today, Agenda, Search and the note screen scroll sideways, by up to 1,800 px on a phone | wrong behaviour | `ListLabel`, note meta row | `7e4445e` | `e2e/long-content.spec.ts` |
| 12 | A quick note without a title was a blank row in the Inbox, where everywhere else says Untitled (R16, R17) | cosmetic | Inbox | `2bfe6fb` | `e2e/t6-t8-inbox.spec.ts` |

`3f8a2f0` fixes a problem introduced by `10c91a2` on this branch. The redirect also fired on a deliberate sign-out and raced the reload that empties the local copy, so only an expired login redirects now.

## Questions about the rules

1. **Conflicts (sync 4)**
   - The rule says the change with the later `updated` time wins.
   - The code compares `changed_at`, the device's own time of the change. A change made offline yesterday therefore loses to one made today, even if it reaches the server later.
   - With `updated`, the last device to sync would win instead.
   - **Answered:** the build plan stands; the later `updated` wins. Changed in `fix/sync-conflict-rule` ([plan](../plans/sync-conflict-rule.md)), released as `v1.1.1`.
2. **The done/total pill (R11)**
   - "Counts today's items" includes events, from the app and the calendar, but events can never be ticked.
   - So a day with an event never reaches "3 / 3 done", even though "All done" does appear.
   - Should events count?
3. **The next-up card**
   - T1 and the screens give the dark card no checkbox, so the next timed todo can only be ticked from its editor or after it's no longer next.
   - Intended? You asked for ticking everywhere.
4. **Closed lists (R26)**
   - Restoring an archived item whose list is closed (archived, not deleted) puts it back in that closed list, where it stays out of sight until the list is reopened.
   - I treated that as intended and only rescued items from deleted lists.
5. **This week's "notes written" (R29)**
   - Quick notes still in the Inbox don't count. The screen lists them separately as "N quick notes left in the inbox".
   - I took that as the design.
6. **Calendar events spanning several days (R13)**
   - A calendar event that ends on a later day (other than an all-day event) becomes a single timed item on its start day with no end time, so on Today it reads as ended from its start time.
   - Showing such events properly needs a decision on how they should look across the days they cover.

## Found but not fixed or not reproduced

- **A photo could be uploaded twice.**
  - If the app is closed in the instant after the server has accepted a photo but before the queue entry is removed, it uploads again on the next start.
  - The window is a few milliseconds. Making it impossible needs a server-side idempotency key for photo uploads, which is a schema decision.
- **Short-lived sheets keep the date they opened with:** the Pick sheet's "Left over", the date picker's "today" and Stop repeating. They are only open for seconds, so midnight inside one isn't worth the change.
- **Not checked by hand:**
  - **Android on a device:** background and back, killed and reopened, rotation, sharing while closed, camera or files permission denied. The code paths were read and nothing looked wrong, but they need a phone.
  - **Desktop:** the hotkey while minimised or in the tray, window size and position, closing versus quitting. The release starts; the rest needs someone at the desktop.
- **T16** (Ctrl+Space capture) failed once in about ten full end-to-end runs over the last days and passed in every run since. Not reproduced.
