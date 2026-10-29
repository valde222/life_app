# 2 · First launch

**Goal:** a new, empty account gets groups and lists in two screens, then an empty Today with one tip.

**Covers:** screens Welcome, SetupGroups, SetupLists, FirstToday; design system Empty state.

## Behaviour

- After signing in, if there are no groups at all (after the first pull), go to Your groups: Life and Work picked, Family, Hobbies and Study offered, "New group".
- Your lists: per picked group, suggested lists (Life: Life, Shopping, Apartment picked, Someday offered; Work: Client A picked, Client B, Admin offered), "New list". Continue creates them with colours in order.
- First Today: "Nothing yet." and the tip "Capture anything with +. It waits in Inbox until you sort it." with Got it, shown once per device.

## Steps

- [x] Setup groups and lists
- [x] First Today tip

## Done when

Signing in to an empty PocketBase leads through both screens to an empty Today with the tip.
