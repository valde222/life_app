# Tick and untick everywhere

Bug: todos could only be ticked on Today, a list page and the todo editor. The Inbox showed a box you couldn't press, Agenda had no box, Search showed the done state but couldn't change it, and This week couldn't undo a finished todo. R7 (tick → toast with Add note and Undo) now holds wherever a todo appears.

## Behaviour

- **One action:** `Ticking` ticks with the toast "\<title> done" (Add note, Undo) and unticks with "\<title> is not done" (Undo). Today keeps its "is back on Today" wording; list pages gain Add note, like Today.
- **One box:** `TickBox` is the box itself, with the same tick pop as Today. On screens whose rows are a link or a button, it sits over a placeholder of the same size, so rows look exactly as before when idle.

| Screen | Can tick | Can untick |
| --- | --- | --- |
| Inbox | todos (a ticked todo leaves the Inbox) | through Undo |
| Agenda | dated one-off todos; not events, not repeating chores (Today and Repeating handle those) | through Undo |
| Search | todo results | done results |
| This week | | finished todos |
| Today, a list, the todo editor, Archive › Done | as before | as before |

## Steps

- [x] `Ticking` and `TickBox`, with tests; Today and lists use `Ticking`
- [x] Inbox, Agenda, Search, This week
- [x] End-to-end test that ticks and unticks on each screen; tests, lint and visual check pass; merge to `main`
