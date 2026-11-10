# Inside core

How the modules inside `core` import each other. Generated from the real imports by `npm run diagrams` in `app/`; don't edit by hand.

```mermaid
flowchart TD
  subgraph core["core"]
    core_calendar["calendar"]
    core_data["data"]
    core_logging["logging"]
    core_platform["platform"]
    core_provide_core["provide-core"]
    core_reminders["reminders"]
    core_server["server"]
    core_session["session"]
    core_share["share"]
    core_sync["sync"]
    core_time["time"]
    core_toasts["toasts"]
  end
  core_calendar --> core_data
  core_calendar --> core_logging
  core_data --> core_platform
  core_data --> core_server
  core_data --> core_sync
  core_data --> core_time
  core_platform --> core_logging
  core_provide_core --> core_data
  core_provide_core --> core_logging
  core_provide_core --> core_sync
  core_reminders --> core_data
  core_reminders --> core_logging
  core_server --> core_sync
  core_session --> core_data
  core_session --> core_server
  core_session --> core_sync
  core_share --> core_data
  core_share --> core_toasts
  core_sync --> core_data
  core_sync --> core_logging
  core_sync --> core_server
```

- The arrows both ways between `data`, `sync` and `server` are between folders. No file-level import cycle exists, and `npm run lint` fails if one appears.
