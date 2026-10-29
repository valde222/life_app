# 4 · Events, calendars and reminders

**Goal:** the phone's calendars show up alongside todos, read-only; events never get a checkbox; reminders fire on the phone.

**Covers:** R12, R13, R14, T14; open questions Calendar window, Past events on Today, Reminders in v1.

## Behaviour

- **Calendar import (R13).** On the phone only (`@ebarooni/capacitor-calendar`, read-only access). Settings › Calendars lists the phone's calendars with a switch each; the choice is stored in the `settings` record (`calendars: [{ id, name, enabled }]`), so the desktop shows the names too. On start, on resume and every 15 minutes the phone reads enabled calendars from 2 weeks back to 3 months ahead and writes them to `calendar_events` through the outbox: a stable id per calendar, event and start, so re-imports update in place; events gone from the calendar are soft-deleted. Nothing is written back to any calendar.
- **Showing them (R12, R14).** Calendar events join todos on Today (Scheduled, or Anytime when all-day) and later in Agenda, with the Event label and no checkbox. Tapping one opens a read-only event page: title, calendar, date and time, no editing.
- **Past events on Today** stay in Scheduled but fade once they've ended. (Open question settled: fade.)
- **Reminders** are Android notifications only in v1 (`@capacitor/local-notifications`), scheduled on the phone from each todo's `reminder` and cancelled when it's done, deleted or changed. (Open question settled: Android only.)

## Steps

- [ ] Calendar events on Today, faded past events, read-only event page
- [ ] Settings › Calendars and the phone importer with unit tests
- [ ] Android reminders
- [ ] e2e T14 (web side: imported events show read-only)

## Done when

T14 passes and enabling a calendar on the phone brings its events onto Today on both devices.
