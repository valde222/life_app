# Bug sweep

A sweep of the whole app against `docs/build-plan.md`: the behaviour rules (R1–R30), the acceptance tests (T1–T16) and the offline and sync rules. A bug is anything that breaks those, crashes, loses or duplicates data, shows something wrong, or behaves differently on phone and desktop.

Every fix goes the same way:
1. Reproduce the bug.
2. Write a test that fails.
3. Fix it, see the test pass, and commit it on its own (`fix: … (Rn)`).

Intended behaviour and design stay as they are. Unclear or conflicting rules become questions in the report (`docs/bugs/bug-sweep-report.md`), not guesses. Branch `fix/bug-sweep`. To resume, continue from the first unticked box.

## 1. Rules against code

- [x] Capture: R1–R4
- [x] Today: R5–R11
- [x] Events and calendars: R12–R14
- [x] Inbox: R15–R18
- [x] Repeating: R19–R21
- [x] Lists and notes: R22–R25
- [x] Archive, done and delete: R26–R27
- [x] Agenda, This week, Search: R28–R30
- [x] Offline and sync 1–7
- [x] T1–T16 each still checked by a test that would fail if broken

## 2. Using the app

- [x] A crawl of every screen and sheet, at phone and desktop size, failing on any console error or failed request
- [x] Clicked through by hand-driven Playwright, at phone size and on desktop
- [x] The desktop shell started from its release build

## 3. Static checks

- [x] TypeScript, ESLint, the boundary and token checks, clippy
- [x] Unhandled promises; listeners, timers and subscriptions that outlive their screen
- [x] Console errors and warnings during the end-to-end run

## 4. Edge cases

- [x] Dates and time:
  - midnight with the app open (Today, left over and the done count roll over);
  - DST on 25 Oct 2026 and 28 Mar 2027;
  - weeks running Monday to Sunday;
  - month and year ends;
  - leap years.
- [x] Repeating:
  - roughly and on a schedule;
  - every 1, 2 and 4 weeks;
  - several weekdays;
  - "Just count days";
  - ticking twice on one day;
  - tick then Undo;
  - stopping and restarting;
  - when the red tag starts.
- [x] Events:
  - with and without an end time;
  - crossing midnight;
  - all-day;
  - the next-up card after the day's last item;
  - Event switched on and off on an item with steps.
- [x] Offline and sync:
  - send order;
  - closed mid-sync;
  - two devices editing one record;
  - deletes reaching the other device;
  - photos taken offline;
  - live updates applied twice;
  - login expiring mid-session.
- [x] Calendar import:
  - events changed or deleted on the phone;
  - repeated syncs;
  - calendars turned off;
  - permission denied.
- [x] Android: background and back, killed and reopened, rotation, the back button on every screen and sheet, sharing while closed, camera or files permission denied.
- [x] Desktop:
  - the hotkey while minimised, in the tray or already open;
  - window size and position;
  - closing versus quitting.
- [x] Data:
  - empty states;
  - very long titles and notes;
  - hundreds of items;
  - special characters and emoji;
  - an empty title;
  - a list or group deleted with items in it;
  - the 30-day purge;
  - Restore after its list was deleted.
- [x] Counts and badges: the Inbox badge, done/total, left over and group summaries match what's on screen.

## 5. Finish

- [x] All tests pass, lint is clean, both apps build
- [x] `docs/bugs/bug-sweep-report.md`: each bug with severity, place, fix commit and test; questions; anything not reproduced
- [ ] Pull request with the report as its description: no GitHub remote yet, so the branch is ready and `docs/bugs/bug-sweep-report.md` is the description
