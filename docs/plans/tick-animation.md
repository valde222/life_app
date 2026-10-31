# Tick animation

Ticking a todo made its row vanish at once, so it was hard to see what had happened. Now the row shows the tick before it leaves (R7 is otherwise unchanged: same toast, same Undo, same "N done" fold).

## Behaviour

1. Press the box: it fills and the title is struck through at once.
2. After a short beat the row slides right and fades, then closes up so the rows below move up smoothly.
3. Only then is the todo saved as done, and the toast appears. About 0.6 s in all.
4. With "reduce motion" switched on in the system, it saves at once, as before.
5. A second press while the row is leaving does nothing. If the row is still there a moment after saving (the save failed), it comes back.

Same for overdue repeating chores on Today, which also leave the list when done. Unticking (done back to not done) and the Repeating screen, where rows stay, are unchanged.

## Steps

- [x] `TickOut` in `shared/ui`: the leaving state, the timing, reduced motion; unit tests
- [x] TodoRow and RepeatRow (checkbox mode) use it; one shared keyframe in the global styles
- [x] Tests pass (unit, e2e, visual unchanged), lint clean; merge to `main`
