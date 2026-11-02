# Features to shared

Which shared UI modules each feature uses. Generated from the real imports by `npm run diagrams` in `app/`; don't edit by hand.

```mermaid
flowchart LR
  subgraph features["features"]
    features_agenda["agenda"]
    features_capture["capture"]
    features_inbox["inbox"]
    features_lists["lists"]
    features_notes["notes"]
    features_repeating["repeating"]
    features_search["search"]
    features_today["today"]
    features_todos["todos"]
    features_week["week"]
  end
  subgraph shared["shared"]
    shared_capture["capture"]
    shared_markdown["markdown"]
    shared_pickers["pickers"]
    shared_ticking["ticking"]
  end
  features_agenda --> shared_ticking
  features_capture --> shared_capture
  features_inbox --> shared_pickers
  features_inbox --> shared_ticking
  features_lists --> shared_capture
  features_lists --> shared_pickers
  features_lists --> shared_ticking
  features_notes --> shared_markdown
  features_notes --> shared_pickers
  features_repeating --> shared_pickers
  features_search --> shared_ticking
  features_today --> shared_ticking
  features_todos --> shared_pickers
  features_week --> shared_ticking
```

- Not drawn, because most features use it: `shared/ui`, used by all but `capture`, `sign-in`.
- No other arrows, so not drawn: `archive`, `settings`, `setup`, `sign-in`.
