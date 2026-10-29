# 2 · Capture and Add details

**Goal:** capture a todo or quick note in two taps from anywhere, and add details when wanted.

**Covers:** R1 (+ button; share sheet in `2-share-sheet`; hotkey in phase 6), R2, R4, T3, T4.

## Behaviour

- The + in the nav opens the capture sheet (CaptureSheet, CaptureJot): Todo / Note, a title field, a date chip, a list chip ("Inbox ▾" opens Move to), Add details, Save.
- Typing a day word at the end of a todo title ("fri", "tomorrow", "today") sets the date chip and is removed from the title on save. The chip's × clears it.
- Saved without a list → `inbox` on (R2). Saved with a list → in that list, `inbox` off.
- Add details (todo) opens the full-screen New todo editor (CaptureTodo): title, List, Date, Time, Repeat, Event, Reminder, Steps. Turning Event on: no checkbox, no Steps, title "New event" (R4). End time optional (TimePicker From–to).
- Add details (note) opens the note editor (CaptureNote) with title, list chip and body. Photos and links come in phase 3.
- Pickers as sheets: Date (quick choices + month grid + time row), Time (At a time / From–to, presets, wheels), Reminder (Off, At the time, 10 minutes before, 1 hour before, Morning of), Move to (Recent and group tabs, list rows with todo counts).
- The same editor is the todo detail screen (`/todo/:id`), used from Today and the Inbox.
- Repeat shows "Never" and is wired up in phase 4.

## Files

`app/src/app/capture/`, `app/src/app/todo/`, `app/src/app/note/`, `app/src/app/pickers/`, `app/src/app/time/`.

## Steps

- [ ] Day-word parsing and date labels ("Fri 23 Oct", "Today") with unit tests
- [ ] Capture sheet, todo and quick note
- [ ] Move to sheet
- [ ] Date, Time and Reminder pickers
- [ ] Todo editor: New todo / New event / detail, steps
- [ ] Note editor (title, list, body)
- [ ] e2e T3 and T4

## Done when

T3 and T4 pass.
