# Finding chores

Bug: repeating items ("chores") were hard to find.
- **Search:** they turned up looking like plain todos, opened the todo editor, and their box would have marked the whole chore done.
- **Repeating screen:** the only ways in were Today's Repeating heading, which only shows while something is overdue, and a chore row in Agenda.

## Behaviour

- **Search:** a chore looks as it does on Repeating, with its tag (days since, or the next day due) and a button that marks it done today. Tapping it opens the chore's repeat settings. It shows under All and Todos.
- **Lists:** a "Repeating" card above the groups ("N chores", plus "M overdue" if any) opens the Repeating screen.
- **Desktop sidebar:** "Repeating" joins Today, Agenda, Inbox and Search.

## Steps

- [ ] Search marks chores and shows them as chore rows
- [ ] The Repeating card on Lists, and the sidebar entry
- [ ] End-to-end test; tests, lint and visual check (only Lists, Search and the desktop sidebar change); merge to `main`
