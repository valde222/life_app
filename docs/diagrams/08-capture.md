# Capture

Every way something gets into the app, and where each one lands.

```mermaid
flowchart TD
  plus["+ button, phone"] --> sheet
  sidebar["Capture button, desktop sidebar"] --> sheet
  inapp["Ctrl+Space inside the app,<br/>where no desktop hotkey is registered"] --> sheet
  listadd["Add on a list page<br/>list already set"] --> sheet
  hotkey["Ctrl+Space anywhere, desktop"] --> window
  tray["Tray › Capture"] --> window
  window["Capture window, /capture"] --> sheet

  sheet{"Capture form:<br/>todo or note, list picked?"}
  sheet -- "no list" --> inbox["Inbox<br/>a dated todo also shows on that day"]
  sheet -- "list picked" --> list["That list"]
  sheet -- "Add details" --> editor{"Todo or note editor"}
  editor -- "todo: no list and no date" --> inbox
  editor -- "todo: a date, no list" --> dated["Today or Agenda, not the Inbox"]
  editor -- "list picked" --> list
  editor -- "note: no list" --> inbox

  share["Android share sheet"] --> receiver["ShareTargetPlugin, then ShareReceiver"]
  receiver -- "text or link: a note" --> inbox
  receiver -- "images only: a note titled Photo" --> inbox

  search["Search: capture as note"] --> inbox
  linkpicker["Link picker: new note"] --> linkednote{"Linking from a list?"}
  linkednote -- "yes" --> list
  linkednote -- "no" --> inbox
  addnote["Add note after a tick,<br/>or Write a note on a todo"] --> linked["New note in the todo's list, linked to it"]
  chore["Repeating: + New"] --> repeating["Repeating, in the list picked"]
  calendars["Phone calendars, every 15 minutes and on resume"] --> events["calendar_events: Today, Agenda, read-only"]
```

- R3 says shared photos become a quick note, but `ShareReceiver` only counts the images for the title: the note has no photos.
- The form and the editor differ on a dated todo with no list: the form keeps `inbox` on, the editor turns it off.
- The home-screen widget in R1 is planned for version 2, and doesn't exist.
