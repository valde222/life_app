# 5 · Agenda, This week, Search, Archive, Settings

**Goal:** look ahead (Agenda), look back (This week), find anything (Search), and get things back (Archive, Done, Recently deleted).

**Covers:** R11 (pill opens This week), R26, R27, R28, R29, R30, T15; screens Agenda, AgendaMonthView, AgendaPick, Week, Search, SearchEmpty, Archive, Deleted, Settings; component WeekStrip, AgendaRow.

## Behaviour

- **Agenda (R28).** Month eyebrow, "Agenda.", a week strip (Mon–Sun, today outlined, the picked day dark, a dot under days with items). Its handle opens the month view (arrows, "October 2026 ▾" opens a year of months). Below, day by day from the picked day for three weeks: a header ("TODAY, WED 21 OCT"), then Agenda rows: timed items with the start (and end under it) in a 64px column, untimed without; events with a grey Event label; repeating items due that day on a quiet row with days since in the time column. Runs of empty days fold into one line ("SUN 25 OCT – MON 26 OCT", "Nothing planned").
- **This week (R29).** Monday to Sunday of this week: things done and notes written, quick notes left in the inbox (opens Inbox), a bar per day with today dark, Finished (done todos with steps and day), By list, Notes written (first three, "Show N more").
- **Search (R30).** Field at the top, Cancel; All / Todos / Notes and "Archive ›" (Archive with the same query). Matches todo titles and note titles and bodies, case-insensitive, live items only, newest first, split Recent (last 7 days) and Earlier. Empty query shows recent items. No match: 'No results for "x".' and 'Capture "x" as a note'.
- **Archive (R26).** Archive / Done. Archive: a search field, archived todos and notes grouped by day archived, each with Restore and delete; Closed lists with Restore and delete; "Recently deleted N ›". Done: done todos by day done, each with Not done.
- **Recently deleted (R27).** Deleted todos, notes and lists with "Note, 27 days left", Restore; Empty now removes them for good. After 30 days they're gone: hidden at once on the device, purged nightly on the server.
- Removing for good is a new outbox operation: a hard delete sent to PocketBase, so other devices drop the record when the delete arrives live or on their next pull (missing records are pruned after a full pull).
- **Settings.** Signed in as, server address, Sync (last synced, tap to sync now), Calendars, Lists and groups, Archive, Recently deleted, Sign out. Week start, default reminder and "New todos go to" from the screen are left for later; they need behaviour the build plan doesn't define.

## Steps

- [ ] Hard delete in the outbox and pruning on pull
- [ ] Agenda with week strip, month view and month picker
- [ ] This week
- [ ] Search
- [ ] Archive, Done and Recently deleted
- [ ] Settings
- [ ] e2e T15

## Done when

T15 passes.
