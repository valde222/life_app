# 2 · Today

**Goal:** what's on today at a glance, ticked off in one tap.

**Covers:** R5, R6, R7, R8, R9, R11, R12, R25 (toast's Add note), T1, T2, T8.

## Behaviour

- Shows todos and events dated today, not done (R5). Timed ones under Scheduled, sorted by time; the rest under Anytime.
- The next timed item still to come is the Next card: "in 1h 20m", plus ", until 13:00" only with an end time (R6). Events show an "Event" label and no checkbox anywhere (R12).
- Ticking sets `done_at`; toast "<title> done" with Add note (a new note linked to the todo, opened in the note editor) and Undo (R7). Done items fold into "N done" at the bottom; unticking brings them back.
- Left over: todos dated before today, not done, not repeating (R8). They don't show on Today; "+ Pick for today" shows "N left over".
- Pick for today (sheet): search, filters All, Due soon, Left over, then each list; opens on Left over when there are any (R8). + sets the date to today (R9).
- The "done / total" pill counts today's items (R11) and will open This week (phase 5).
- Header: date eyebrow, pill, avatar (Settings, phase 5). Offline status pill from phase 1.
- Empty states: "All done." with See this week and Pick something else; "Nothing yet." on first launch.
- The time comes from one clock service so tests can fix it; the screen refreshes each minute.
- Today's Repeating section comes in phase 4; This week link in phase 5.

## Steps

- [x] Clock service, today's items, Scheduled and Anytime
- [x] Next card timing
- [x] Ticking, toast, done fold
- [x] Left over and Pick for today
- [x] Pill and empty states
- [x] e2e T1, T2, T8

## Done when

T1, T2 and T8 pass.
