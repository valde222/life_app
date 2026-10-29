# 2 · Shared components

**Goal:** the pieces every screen is built from, matching `docs/design-system/components/` and only using tokens.

**Covers:** design system components; used by every rule in phases 2–6.

## Pieces

| Component | Notes |
| --- | --- |
| `Icon` | The 24 × 24 line icons from the screens, by name, 1.8 stroke (2 when active) |
| `ListLabel` | List name on its colour pair; also the 34px Move to chips |
| `TodoRow` | 44px tap target checkbox, optional time, title (two lines then cut), one trailing value, list label |
| `EventRow` | Time, title, "Event" label, no checkbox (R12) |
| `NextCard` | Accent card, `time-large`, "in 1h 20m", "until 13:00" only with an end time (R6) |
| `SwipeRow` | Pointer-driven swipe with an action under each side |
| `Sheet` | Bottom sheet on `@angular/cdk` Dialog: `bg`, grab handle, scrim, focus kept inside |
| `Toast` | One at a time, 164px from the bottom, optional second action, Undo, gone after 5 s |
| `BottomNav` + main layout | Search bar, Today, Agenda, capture, Inbox with badge (R15), Lists; search bar tucks away on scroll down |
| `SegmentedControl`, `DetailRow`, `Switch`, `EmptyState`, buttons | As specified |

## Steps

- [ ] Icons collected from the screens
- [ ] ListLabel, TodoRow, EventRow, NextCard
- [ ] Sheet and Toast services
- [ ] BottomNav and main layout with routes for Today, Agenda, Inbox, Lists, Search
- [ ] SegmentedControl, DetailRow, Switch, EmptyState, button styles
- [ ] SwipeRow
- [ ] Unit tests for the parts with logic (NextCard timing, toast lifetime, swipe thresholds)

## Done when

Today and Inbox can be built from these pieces with no one-off colours or sizes.
