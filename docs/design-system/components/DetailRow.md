# Detail row

The settings of one todo: list, date, time, repeat, event, reminder.

- Label in `ink-2` on the left, value in `ink` 600 on the right. Empty values say "None" or "Off" in `muted`.
- Each row opens its own picker (Move to, Date, Time, Reminder). Repeat opens the repeating setup and turns the todo into a repeating item, roughly or on a schedule. No chevrons needed; the value looks tappable.
- Rows share one card with `divider` hairlines, 52px tall.
- Event is a switch, not a picker: on makes the todo an event (no checkbox, no steps, and the capture sheet says "New event"). The switch is 48 × 28, `accent` when on, `control` when off.
