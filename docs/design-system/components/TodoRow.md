# Todo row

The white row every todo and repeating item sits in.

- A 44 × 44 tap target on the left with a checkbox (`radius-check`). Repeating items get the same checkbox: ticking one resets its counter.
- The title in the `row` style, one line (two in a list when it is long, then cut).
- At most one trailing value (steps like "1/3", a time) plus a list label where the list isn't obvious from the screen.
- Repeating items show days since in a tag with a small repeat icon. Past due the tag turns `overdue-*`. A scheduled one shows its next day instead ("Thu").
- A todo with a time shows the time before the title. Events are not todo rows: they have no checkbox (see Agenda row).
- No second line on Today or in the inbox; the icon already says todo or quick note.
