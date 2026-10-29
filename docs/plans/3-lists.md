# 3 · Lists, groups and a list's page

**Goal:** everything that isn't in the Inbox lives in a list, and lists live in groups.

**Covers:** R22, R23, T10; screens All, List, ListEmpty, ListSettings, ManageLists, NewGroup, NewList, LongTitles, SwipeActions, SwipeNote; components GroupBox, ListRow.

## Behaviour

- **Lists.** One box per group, open or closed; which are open is remembered on the device. Closed: "N lists, M todos" (or "N lists" with no todos); open: no count, its list rows ("5 todos, 9 notes" or "Empty"), then "+ New list" (R22). "+ New group" under the last box. Edit opens Edit lists.
- **New list** inside a group opens "New list in <group>." with name and colour (the next unused colour, warm for Work), and creates it in that group without asking (R23). **New group**: name only.
- **A list.** Back to Lists, Edit (List settings), the group as eyebrow, "<Name>.", Todos N / Notes N. Todos: rows with the date as trailing value ("Fri"), "+ Add todo" (capture sheet with this list), "N done" fold. Notes: cards with title, date and first line, "+ New note". Empty tab: "No todos yet." / "No notes yet." with the add action.
- **Swipes in a list.** Todo right → on Today; left → actions sheet (Put on Today, Date…, Move to…, Repeat…, Delete). Note left → actions sheet (Move to…, Link to…, Archive, Delete).
- **List settings.** Name, group, colour, Archive list (moves it to Archive › Closed lists, phase 5), Delete list (its items go to Recently deleted).
- **Edit lists.** Per group: rename, delete (only when empty), rows with drag handles to reorder (also across groups), counts, open List settings; "+ New list", "+ New group".
- Long titles wrap to two lines then cut (LongTitles).

## Steps

- [x] GroupBox and ListRow; Lists screen with remembered open groups
- [x] New list and New group sheets
- [x] List page with Todos and Notes tabs, empty states, swipes and action sheets
- [x] List settings
- [x] Edit lists with reordering
- [x] e2e T10

## Done when

T10 passes.
