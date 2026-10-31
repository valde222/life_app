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
| 10 | Agenda | The week strip opening into the month: the month grid fades in and grows from the top (year view: fades in) | base | enter |
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
| F2 | Steps in the todo editor | A step you add expands in; a step you remove collapses out | base | enter / exit |
| F3 | "Inbox zero." | Fades in when the last item leaves the Inbox | base | enter |
| F4 | Note photo thumbnails | A photo you add fades and scales in from 90%; a deleted one fades out | base, fast | enter, exit |

Considered and left out: animated route changes (a view transition would hold input for its length), and rows animating as you type in Search (it would fire on every key).

## Steps

- [x] This plan, and a `TODO.md` line
- [x] Motion tokens in `tokens.json`, generated into `_tokens.scss`; Motion section in the design-system README; the reduce-motion rule; the lint check
- [x] Shared pieces: `Settled`, row enter/leave keyframes, `TickOut` on the new timings
- [x] Moments 1–14, one commit each
- [x] End-to-end tests run with reduced motion; tests for the motion-specific code
- [x] Checked by eye: phone and desktop layouts, and once with reduced motion; both apps build
- [ ] Pull request: the repo has no GitHub remote, so the branch is ready and the description is below

## Checked

- **Frames:** every moment was captured frame by frame (about every 45 ms) at phone size and on desktop with motion on, and again with reduced motion. That check found three rough edges, fixed in `fix(motion)`: row exits playing on tab switches, an Inbox card snapping shut before leaving, and the Repeating heading vanishing early.
- **Tests:** 157 unit tests and 23 end-to-end tests pass; the end-to-end tests run with reduced motion, apart from one tick test with motion on. Lint is clean, and every screen still matches the pre-motion screenshots pixel for pixel.
- **Builds:** the APK builds with the Haptics plugin inside, the Android tests pass, the Windows build starts.
- **Not checked by hand:** the haptic tick on a real phone, and the feel on a mid-range device. Both need someone holding one.

## Pull request description

Small, quick motion on the everyday moments. Behaviour, layout and wording are unchanged; every screen is pixel-identical at rest. All timings come from three duration tokens (120, 200 and 300 ms) and three easings; nothing runs over 350 ms, nothing blocks input, and with reduce motion on nothing moves.

Moments animated:
1. Ticking a todo: the box fills, the tick pops, the title is struck through, the row collapses away; the done count and pill change gently; Undo expands it back.
2. Toasts slide up above the nav and down when they go.
3. New items expand in where they land; the Inbox badge bumps.
4. Inbox: Keep, Make todo and Archive collapse the card away; opening an item grows it in place.
5. Swipe rows reveal their action with the drag, the icon grows when armed, a haptic tick on Android.
6. Sheets slide up and down (dialogs scale on desktop), and drag the handle down to dismiss.
7. The Event switch collapses the steps and cross-fades the heading.
8. Overdue chores on Today turn their tag to Today, then leave.
9. List groups expand and collapse; segmented controls slide their highlight.
10. Agenda grows into the month and slides between days, weeks and months.
11. Photos zoom in from 90% and back out.
12. Archive and Recently deleted rows collapse out and expand back.
13. The Offline line fades in and out (Today and the sidebar).
14. Pressed state on everything tappable; a quiet hover on desktop text buttons.

Found along the way (judge separately): F1 All done fades in; F2 steps expand in and collapse out; F3 Inbox zero fades in; F4 new photos grow in, deleted ones fade out.
