# Screen map: desktop

The screens from 900px wide: the routes are the [phone's](09a-screens-phone.md), but the sidebar replaces the bottom nav, and a separate window handles capture.

```mermaid
flowchart TD
  subgraph sidebar["Sidebar, always visible"]
    today["Today"]
    agenda["Agenda"]
    inbox["Inbox"]
    search["Search"]
    repeating["Repeating"]
    list["Each list"]
    manage["Edit: Manage lists"]
    settings["Settings"]
  end
  today --> week["This week"]
  search --> archive["Archive and Done"]
  archive --> deleted["Recently deleted"]
  settings --> calendars["Calendars"]
  list --> listsettings["List settings"]
  manage --> listsettings
  manage -- "Done" --> lists["Lists"]
  hotkey(["Ctrl+Space anywhere,<br/>Tray › Capture"]) --> capture["Capture window<br/>always on top"]
```

- Rows open in a detail pane beside the content: see [detail screens](09b-screens-details.md).
- The sidebar has no Lists entry: `/lists` is reached only from Manage lists and List settings. Settings also links to Manage lists, Archive and Recently deleted, as on the phone.
- Ctrl+K opens Search and `?` opens the keyboard shortcuts, from any screen in the main window.
