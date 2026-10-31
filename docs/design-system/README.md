# Life app

A calm, dark-ink look for a personal todo and notes app: light grey ground, white cards, one dark accent per screen, and list names instead of symbols.

This is the visual reference for the Life app. It records what the screens on the design canvas already do, so the app can be built from it. Version 1 is light theme only; dark mode is parked.

## Principles

1. **If it needs explaining, it's bad UX.** No helper sentences on screen. A sentence that explains how the app works means the design needs fixing; at most it becomes a one-time tip the first time a feature is used.
2. **Readable at a glance.** Section headers, a card per item and list labels stay. Cut sentences and duplicate info, never structure.
3. **One dark accent per screen.** `accent` marks the single most important thing: the next appointment on Today, the primary button in a sheet, the capture button.
4. **Words over symbols.** Show "Apartment", not a colored dot. Color supports a word; it never replaces one.
5. **Nothing turns into a wall of red.** `overdue-*` is used for repeating items that are clearly late, and nowhere else.

## Writing

- **Screen titles end with a period:** "Today.", "Inbox.", "Lists."
- **Buttons say exactly what happens:** "Save to Client A", "Keep", "Let go", "Add note". Toasts confirm in two or three words: "Kept as a note", "On Today". No second line.
- **Section headers name your stuff:** "Scheduled", "Anytime", "Earlier", "Repeating". Never "How it works" or "Tip".
- **Show your content, not the app's rules.** Counts, dates, list names and days since are content. "Fades in about a week" or "goes straight to the list" are rules, and they don't belong on screen.
- **Sentence case everywhere** except eyebrows, which are uppercase.
- Dates read like "Wed 21 Oct"; times use 24-hour "17:00".
- **No dot separators.** Join two facts with a comma ("5 todos, 9 notes", "Note, 27 days left"). A count goes right after its word ("Notes 9", "Steps 1 of 3").
- **Counts only where they tell you something you can't see.** No count above a screen title ("8 lists", "5 repeating"), and none on a list you are looking at. Keep them where things are hidden or need attention: the Inbox badge, a closed group, the other tab ("Notes 9"), days since.

## Color

The palette is near-neutral with a slight blue-grey bias, so the list colors carry the only hue.

| Role | Tokens | Rule |
| --- | --- | --- |
| Ground | `bg`, `surface` | Grey page, white cards. No shadows on cards. |
| Text | `ink`, `ink-2`, `muted` | `muted` only on white (4.4:1 on `bg` fails AA); on `bg` use `ink-2` (7.2:1). |
| Accent | `accent`, `on-accent`, `on-accent-2` | One accent element per screen, plus the capture button and toasts. |
| Quiet fills | `soft`, `divider`, `control`, `dashed` | Pills, hairlines, checkbox borders, add-action outlines. |
| Overdue | `overdue-bg`, `overdue-fg`, `overdue-icon` | Only repeating items past due, and Delete. |
| Lists | `life-*`, `apartment-*`, `shopping-*`, `music-*`, `client-a-*`, `client-b-*`, `grey-*` | One pair per list: a pale background and a dark text color of the same hue, at least 7:1. |

A new list picks one of the seven pairs. Work lists default to the warm pairs, life lists to the cool ones.

## Type

Two faces from Google Fonts:

- **Space Grotesk** (`--font-ui`) for everything in the interface.
- **Inter** (`--font-reading`) for the text inside notes and pages only, because long reading is easier in it.

Use tabular figures wherever times or counts line up. The scale is the one in Typography; don't add sizes between its steps.

## Layout

- Phone frame 390 × 844. Side margin `space-4` (16px); screen titles use `space-5` (20px).
- Title block starts 52px from the top, with the date and progress pills above the display title.
- An event is a todo with the Event switch on in its details: it has no checkbox and shows an "Event" label instead of the list label. Its end time is optional; a time range shows the end under the start. Events from your connected calendars look the same. Timed todos keep their checkbox.
- Rows are at least 56px tall, with tap targets of at least 44 × 44px.
- Rows in a section stack with `space-2` (8px) gaps, each its own white card with `radius-row`. Grouped lists (the archive, settings) use one card with `divider` hairlines.
- Sections are separated by `space-5` (20px), each with an eyebrow header.
- The floating nav sits 24px from the bottom and 16px from the sides; content leaves 164px of space beneath it.
- Bottom sheets: `bg` background, `radius-sheet` top corners, a 36 × 4 `control` grab handle, and 32px bottom padding. The screen behind dims with `scrim`.
- Desktop: 240px sidebar in a slightly darker grey, content with 40px padding, an optional 400px detail pane on the right.

## Sizes and corners

Use only the steps in Typography and the radius tokens. The rule of thumb for corners: the bigger the thing, the rounder: `radius-tiny` for bars and dots, `radius-check` for checkboxes, `radius-label` and `radius-chip` for labels and chips, `radius-control` and `radius-input` for buttons and fields, `radius-row` and `radius-feature` for cards, `radius-modal`, `radius-sheet` and `radius-nav` for panels. Grab handles are fully round (`radius-hairline` on a 4px bar).

Spacing comes from the `space-*` steps, including the half steps (`space-half`, `space-1-5` … `space-4-5`), and font sizes outside a type style from `text-*`. Code may not write a colour, spacing, radius or font size the tokens already name; `npm run lint` checks it.

## Motion

Small and quick, so it still feels right the hundredth time. Three durations: `motion-fast` (120 ms) for state changes and anything leaving, `motion-base` (200 ms) for most movement, `motion-slow` (300 ms) for the largest moves; nothing runs longer than 350 ms or blocks input. Three easings: `ease-enter` for things arriving, `ease-exit` for things leaving, `ease-standard` for things that move and stay. Animate only `transform` and `opacity`, plus height when a row collapses or expands. Nothing moves when a screen first fills, only when something changes on it. When the system asks to reduce motion, every animation finishes at once. Code may only use these tokens for durations and easings; `npm run lint` checks it.

## Components

The pieces every screen is built from, each shown below in Components:

- **Todo row**: checkbox, title, at most one trailing value or list label. Repeating items use it too.
- **Next card**: the dark card for the next thing with a time on Today.
- **Agenda row**: one thing on a day in Agenda; events, time ranges, folded empty days.
- **Swipe row**: what swiping right and left does.
- **List label**: the colored word that says which list something belongs to.
- **Button**: primary (accent), secondary (white or `bg`), and the dashed add action.
- **Bottom nav**: a search bar on top, then Today, Agenda, capture, Inbox, Lists. The search bar tucks away while you scroll down and comes back on scroll up.
- **Toast**: a short confirmation with Undo.
- **Sheet**: the bottom sheet every picker and action list uses.
- **Segmented control**: Todo / Note, Todos / Notes.
- **Week strip**: the top of Agenda.
- **List row**: a list with its colour bar and counts.
- **Detail row**: label and value in a todo, each opening a picker.
- **Empty state**: one bold line and at most one action; the first-launch tip.

Desktop shortcuts live only in the ? overlay, never as hint text on screen.
- **Group box**: groups on Lists that open and close, stacked.

## Not decided yet

- Dark mode values (only Today has been drawn in dark).
- Icons are hand-drawn 24 × 24 line icons at 1.8 stroke, not yet collected as files.
- Loading states (sync is meant to be fast enough not to need them).
