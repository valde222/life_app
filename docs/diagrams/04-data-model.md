# Data model

Every PocketBase collection, its main fields and its relations, taken from `pocketbase/pb_migrations/`.

```mermaid
erDiagram
  users ||--o{ groups : owner
  users ||--o{ lists : owner
  users ||--o{ todos : owner
  users ||--o{ steps : owner
  users ||--o{ completions : owner
  users ||--o{ notes : owner
  users ||--o{ calendar_events : owner
  users ||--o{ settings : owner
  groups |o--o{ lists : group
  lists |o--o{ todos : list
  lists |o--o{ notes : list
  todos |o--o{ steps : todo
  todos |o--o{ completions : todo
  notes }o--o{ todos : todos
  notes }o--o{ notes : links

  users {
    email email
    password password
  }
  groups {
    text name
    number order
  }
  lists {
    text name
    relation group FK
    select colour
    number order
    date archived_at
  }
  todos {
    text title
    relation list FK
    bool inbox
    text date
    text time
    text time_end
    bool is_event
    select repeat_mode "none, rough, schedule"
    number repeat_every_days
    number repeat_every_weeks
    json repeat_weekdays
    date reminder
    date done_at
    date archived_at
  }
  steps {
    relation todo FK
    text text
    bool done
    number order
  }
  completions {
    relation todo FK
    text done_on
  }
  notes {
    text title
    text body
    relation list FK
    bool inbox
    file photos "many, protected"
    file files "many, any type, 50 MB each, protected"
    relation todos FK "many"
    relation links FK "many, to notes"
    date archived_at
  }
  calendar_events {
    text calendar UK
    text external_id UK
    text title
    date start
    date end
    bool all_day
    date synced_at
  }
  settings {
    json calendars
  }
```

- The eight synced collections also have `id` (made on the device), `owner` (set by the server), `changed_at`, `deleted_at`, `created` and `updated`.
- `changed_at` isn't in the build plan's data model: the device's time of its last change. Lists sort by it, and a device uses it to recognise its own write coming back. Conflicts go by arrival at the server instead: see [conflicts](05b-sync-conflict.md).
- No relation is required or cascades, so an empty `list` means the Inbox or no list; `calendar_events` and `settings` relate to nothing else.
