# Android shell

Capacitor 8 wrapping the Angular app as the Android app `dk.ottes.life`. Later phases add the share sheet (R3) and calendar import (R13) here.

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

## Talks to

PocketBase, at the address chosen on the sign-in screen.
