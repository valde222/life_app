# Android shell

Capacitor 8 wrapping the Angular app as the Android app `dk.ottes.life`. It also receives shares from other apps (R3), imports the phone's calendars (R13) and shows reminders as notifications.

## Build

From WSL, in `app/`:

```sh
npm run build
LIFE_DEV_SERVER=1 npx cap sync android   # drop LIFE_DEV_SERVER for a build that only talks to HTTPS
```

Then on Windows (from WSL, in `app/android/`):

```sh
cmd.exe /c "gradlew.bat assembleDebug"
```

The APK lands in `app/build/outputs/apk/debug/app-debug.apk`. Install it with the Windows `adb.exe` from the Android SDK's `platform-tools`.

`local.properties` (not committed) points Gradle at the SDK: `sdk.dir=C\:\\Users\\<you>\\AppData\\Local\\Android\\Sdk`.

## Config

| Setting | Where | Use |
| --- | --- | --- |
| `LIFE_DEV_SERVER=1` at `cap sync` | `../capacitor.config.ts` | Lets the app reach a plain-HTTP dev PocketBase (mixed content) |
| Cleartext HTTP | `app/src/*/res/xml/network_security_config.xml` | Never in release builds. Debug builds allow it only to `localhost`, `127.0.0.1` and the emulator's `10.0.2.2`: on a phone, run `adb reverse tcp:8090 tcp:8090` and use `http://localhost:8090` |
| Backups | `allowBackup`, `data_extraction_rules.xml` | Off: notes, photos and the sign-in token stay out of Google cloud backups and device-to-device transfer |
| Server address | Sign-in screen | Kept on the device |

## Native parts

| Part | What it does |
| --- | --- |
| `ShareTargetPlugin` | Receives `ACTION_SEND` text, links and images and hands them to the app, which makes a quick note in the Inbox |
| `@ebarooni/capacitor-calendar` | Read-only calendar access; the app imports enabled calendars from 2 weeks back to 3 months ahead every 15 minutes and on resume |
| `@capacitor/local-notifications` | Todo reminders, rescheduled whenever todos change |

Permissions: `READ_CALENDAR`, `POST_NOTIFICATIONS`, both asked for when first needed.

## Talks to

PocketBase, at the address chosen on the sign-in screen.

## Share target

`ShareTargetPlugin` takes text (capped at 100,000 characters) and images from other apps. It reads an image only from another app's `content://` provider and only if that provider says it's an image; `file://` paths and Life's own providers are refused, so a malicious app can't get Life to copy its private files into a note. The checks live in `SharedContent` and are unit-tested: `gradlew.bat app:testDebugUnitTest`.
