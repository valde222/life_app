# Features to core

Which core services each feature uses. Generated from the real imports by `npm run diagrams` in `app/`; don't edit by hand.

```mermaid
flowchart LR
  subgraph features["features"]
    features_agenda["agenda"]
    features_archive["archive"]
    features_capture["capture"]
    features_inbox["inbox"]
    features_lists["lists"]
    features_notes["notes"]
    features_repeating["repeating"]
    features_search["search"]
    features_settings["settings"]
    features_sign_in["sign-in"]
    features_today["today"]
  end
  subgraph core["core"]
    core_calendar["calendar"]
    core_logging["logging"]
    core_platform["platform"]
    core_server["server"]
    core_session["session"]
    core_sync["sync"]
    core_toasts["toasts"]
  end
  features_agenda --> core_calendar
  features_archive --> core_toasts
  features_capture --> core_platform
  features_inbox --> core_toasts
  features_lists --> core_platform
  features_lists --> core_toasts
  features_notes --> core_logging
  features_notes --> core_toasts
  features_repeating --> core_toasts
  features_search --> core_toasts
  features_settings --> core_calendar
  features_settings --> core_logging
  features_settings --> core_platform
  features_settings --> core_session
  features_settings --> core_sync
  features_sign_in --> core_server
  features_sign_in --> core_session
  features_today --> core_platform
  features_today --> core_session
  features_today --> core_sync
  features_today --> core_toasts
```

- Not drawn, because most features use it: `core/data`, used by all but `capture`, `sign-in`.
- Not drawn, because most features use it: `core/time`, used by all but `capture`, `setup`, `sign-in`.
- No other arrows, so not drawn: `setup`, `todos`, `week`.
