# Animations: micro-interactions

Small, quick motion on the moments that happen many times a day. Only motion is added: behaviour, layout and wording stay as they are. Branch `animations/micro-interactions`; commits `feat(motion): …`. To resume, continue from the first unticked box.

## Ground rules

- Durations come from three tokens only: `--motion-fast` 120 ms, `--motion-base` 200 ms, `--motion-slow` 300 ms. Nothing runs longer than 350 ms, and nothing blocks input.
- Easings come from three tokens only:
  - `--ease-standard` is for things that move and stay.
  - `--ease-enter` decelerates, for things arriving.
  - `--ease-exit` accelerates, for things leaving.
- Only `transform` and `opacity` animate. The one exception is height, when a row collapses or expands; that uses `interpolate-size`, inside the row only.
- Plain CSS transitions and keyframes, plus Angular's `animate.enter` and `animate.leave`. There is no `@angular/animations` and no animation library.
- **Reduce motion:** when the system asks for reduced motion, every animation and transition finishes at once (global rule), and code that waits for an animation doesn't wait. The end-to-end tests run this way.
- **No motion on page load:** rows that appear when a screen first fills don't animate. Only rows added or removed while the screen is open do (`Settled`).
- `npm run lint:styles` refuses durations and easings that aren't tokens.

## Moments

Each line gives what moves, then how long, then the easing.

| # | Moment | What moves | Time | Easing |
| --- | --- | --- | --- | --- |
| 1 | Ticking a todo | The box fills and the tick pops in (scale 0.6→1); a strike line grows across the title (scaleX) | fast | enter |
| | | Then the row fades, slides 24px right and collapses its height; the row below closes the gap. Saved when it has gone (fast + base = 320 ms) | base | exit |
| | | The "N done" count and the done/total pill: the new number slides up 4px and fades in | fast | enter |
| | | Undo: the row expands back in (reverse of the collapse) | base | enter |
| 2 | Toast | In: up 16px and fade in, from above the nav. A new toast replacing one on screen swaps its text in place | base | enter |
| | | Out (time-out, Undo, action): down 16px and fade out | fast | exit |
| 3 | Adding an item | The new row expands in where it lands (Today, Inbox, a list) | base | enter |
| | | The Inbox badge bumps when its count changes (scale 1.25→1) | fast | standard |
| 4 | Inbox: Keep, Make todo, Archive | The card collapses away and the list closes the gap | base | exit |
| | Inbox: opening a quick note | The expanded part fades in and grows from its top edge | base | enter |
| 5 | Swipe rows | The row follows the finger (already), the action underneath fades in as it's revealed, and the row snaps back or away on release | fast | standard |
| | | A light haptic tick when crossing the threshold, on Android only (`@capacitor/haptics`) | | |
| 6 | Sheets (capture, Move to, pickers, New list…) | Panel slides up 100% → 0, backdrop fades in | base | enter |
| | | Closing: panel slides down, backdrop fades out; then the sheet closes | fast | exit |
| | | Drag down on the grab handle to dismiss: the panel follows the finger, past 25% of its height it closes, else it snaps back | fast | standard |
| 7 | Event switch (todo editor) | The checkbox and the steps fade and collapse in or out | base | enter / exit |
| | | "New todo" ↔ "New event" cross-fade | fast | standard |
| 8 | Repeating on Today | Ticking an overdue chore: the red tag turns into the plain "Today" tag (fade), then the row leaves as in 1 | fast, base | enter, exit |
| 9 | Lists: groups | The group body expands or collapses; the chevron rotates (already, now on tokens) | base | standard |
| | Segmented controls (Todos/Notes, Archive/Done, Roughly/On a schedule) | The highlight slides to the chosen segment | base | standard |
| 10 | Agenda | The week strip opening into the month: the month grid fades in and grows from the top | base | enter |
| | | Moving between days and months: the new content slides 12px in the direction of travel and fades in | base | enter |
| 11 | Photos | Opening a thumbnail: the full image zooms from 0.9 and fades in; closing zooms back out | base, fast | enter, exit |
| 12 | Delete and Restore (Archive, Recently deleted) | Rows collapse out and expand back in, as in 1 | base | exit / enter |
| 13 | Offline | The "Offline, N waiting" line fades in and out | base | standard |
| 14 | Buttons and rows | Pressed: scale 0.97 while held, on touch and mouse | fast | standard |
| | | Desktop hover (pointer devices only): text buttons and links dim to 70% | fast | standard |

## Found along the way

Moments not on the list, added under the same rules. Each one is listed here before it is built.

| # | Moment | What moves | Time | Easing |
| --- | --- | --- | --- | --- |
| F1 | Today's "All done." panel | Fades in when the last todo of the day is ticked, instead of appearing all at once | base | enter |

## Steps

- [x] This plan, and a `TODO.md` line
- [ ] Motion tokens in `tokens.json`, generated into `_tokens.scss`; Motion section in the design-system README; the reduce-motion rule; the lint check
- [ ] Shared pieces: `Settled`, row enter/leave keyframes, `TickOut` on the new timings
- [ ] Moments 1–14, one commit each
- [ ] End-to-end tests run with reduced motion; tests for the motion-specific code
- [ ] Checked by eye: phone and desktop layouts, and once with reduced motion; both apps build
- [ ] Pull request (or, without a remote, the branch and its description ready)
