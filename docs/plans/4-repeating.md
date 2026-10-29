# 4 · Repeating items

**Goal:** chores that come round again, either roughly ("about weekly") or on a schedule ("every Mon and Thu"), with days since and a quiet nudge on Today when they're late.

**Covers:** R10, R19, R20, R21, T12, T13; screens Recurring, RecurringDo, StopRepeat, Main (Repeating section).

## Rules in code (`repeating/repeat-status.ts`, unit-tested)

- **Roughly:** days since the last completion (or since it was made, if never done). Targets: Every few days 3, Weekly 7, Every 2 weeks 14, Monthly 30, Just count days 0 (no target). Overdue once days since passes the target (`days > target`); Just count days is never overdue (R19).
- **On a schedule:** weekdays plus every 1, 2 or 4 weeks, counted from the week the item was made. The next due day is the first scheduled day from today that isn't done. Overdue from the day after a scheduled day that wasn't done (R20).
- Ticking adds a completion for today (R10); "Did it yesterday" adds one for yesterday.

## Screens

- **Today › Repeating:** only overdue items (R10), with the red days tag; "All" opens Repeating. Ticking removes the item from Today with a toast and Undo.
- **Repeating:** every repeating item, most overdue first: repeat icon (red when overdue), name, how often, days since / next day. Tap opens a sheet with days since, a bar towards the target, recent completions, Done today, Did it yesterday, Edit. "+ New".
- **Repeat editor** (from + New, a todo's Repeat row, Repeat… in the Inbox and lists): Roughly / On a schedule, the choices above, List, Last done with Done today, Stop repeating, Delete.
- **Stop repeating** (R21): "Make it a todo." with list and date choices; Make todo turns it back into a todo with that list and date; its completions stay.

## Steps

- [x] Repeat status rules with unit tests
- [x] Repeat editor and Stop repeating
- [x] Repeating screen and its sheet
- [x] Today's Repeating section
- [x] e2e T12 and T13

## Done when

T12 and T13 pass.
