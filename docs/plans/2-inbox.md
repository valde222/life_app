# 2 · Inbox

**Goal:** everything captured without a list waits here until it's sorted.

**Covers:** R15, R16, R17, R18, R9, T3, T6, T7.

## Behaviour

- Inbox lists todos and notes with `inbox` on, not done, archived or deleted, split into Today and Earlier by `created` (R16). Newest first.
- Badge on the nav counts them (R15), hidden at zero.
- Tapping a quick note opens it in place: Keep (opens Keep note: title, Add to a list, body; Save takes it out of the Inbox, into the list if one was picked), Make todo (turns it into a todo, still in the Inbox), Archive (R17).
- Tapping a todo opens it in place: Move to chips (recent lists, More…), Today, Date, Delete. The title opens the todo detail.
- Swipes (R18): todo right → dated today, out of the Inbox, toast "On Today"; todo left → Move to; note right → kept, toast "Kept as a note"; note left → archived, toast "Moved to the archive". Every swipe can be undone.
- Empty: "Inbox zero." with one line under it.

## Steps

- [ ] Inbox screen with sections and badge
- [ ] Note actions and Keep note
- [ ] Todo actions
- [ ] Swipes with undo
- [ ] Inbox zero
- [ ] e2e T6 and T7

## Done when

T3, T6 and T7 pass.
