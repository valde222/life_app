# Android native parts

The Java classes and Capacitor plugins of the Android shell in `app/android/`, and the Angular services that use them.

```mermaid
flowchart LR
  subgraph java["dk.ottes.life (Java)"]
    main["MainActivity"]
    target["ShareTargetPlugin"]
    content["SharedContent<br/>safety checks and caps"]
    images["SharedImages<br/>reads image streams"]
    opener["FileOpenerPlugin<br/>downloads to cache, ACTION_VIEW"]
    opening["FileOpening<br/>URL and name checks, size cap"]
  end
  subgraph plugins["Capacitor plugins"]
    calendar["capacitor-calendar"]
    notifications["local-notifications"]
    haptics["haptics"]
    appplugin["app"]
  end
  subgraph angular["Angular core services"]
    receiver["share/share-receiver"]
    importer["calendar/calendar-importer"]
    reminders["reminders/reminders"]
    hapticsts["platform/haptics"]
    back["platform/back-button"]
    fileopener["platform/file-opener"]
  end

  main --> target
  target --> content
  target --> images
  images --> content
  target -- "shared event, takePending" --> receiver
  importer --> calendar
  reminders --> notifications
  hapticsts --> haptics
  back --> appplugin
  main --> opener
  opener --> opening
  fileopener -- "open url, name" --> opener
```

- Android asks for `READ_CALENDAR` and `POST_NOTIFICATIONS`, both when first needed.
- `SharedImages` reads the images, but the app only counts them for the note's title: see [Capture](08-capture.md).
- `FileOpenerPlugin` downloads a note's file into `cache/opened/` (folders older than a day are cleared), then hands it to another app through the FileProvider. It only downloads over HTTPS, or HTTP from `localhost`, `127.0.0.1` and the emulator's `10.0.2.2`.
