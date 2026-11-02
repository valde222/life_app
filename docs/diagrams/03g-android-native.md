# Android native parts

The Java classes and Capacitor plugins of the Android shell in `app/android/`, and the Angular services that use them.

```mermaid
flowchart LR
  subgraph java["dk.ottes.life (Java)"]
    main["MainActivity"]
    target["ShareTargetPlugin"]
    content["SharedContent<br/>safety checks and caps"]
    images["SharedImages<br/>reads image streams"]
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
```

- Android asks for `READ_CALENDAR` and `POST_NOTIFICATIONS`, both when first needed.
- `SharedImages` reads the images, but the app only counts them for the note's title: see [Capture](08-capture.md).
