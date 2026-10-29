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
| Cleartext HTTP | `app/src/debug/AndroidManifest.xml` | Debug builds only, for the dev server |
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
