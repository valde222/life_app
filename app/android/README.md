# Android shell

Capacitor 8 wrapping the Angular app as the Android app `dk.ottes.life`. It also receives shares from other apps, imports the phone's calendars and shows reminders as notifications. See the [native parts](../../docs/diagrams/03g-android-native.md).

## Run in development

From WSL, in `app/`:

```sh
npm run build
LIFE_DEV_SERVER=1 npx cap sync android   # drop LIFE_DEV_SERVER for a build that only talks to HTTPS
```

Then from WSL, in `app/android/`:

```sh
cmd.exe /c "gradlew.bat assembleDebug"
```

The APK lands in `app/build/outputs/apk/debug/app-debug.apk`. Install it with `adb.exe` from the Android SDK's `platform-tools`. To reach the dev PocketBase from a phone, run `adb reverse tcp:8090 tcp:8090` and use `http://localhost:8090`.

Tests: `cmd.exe /c "gradlew.bat app:testDebugUnitTest"`, after a `cap sync`.

## Run in production

Pushing a `v*` tag builds a signed release APK and attaches it to a GitHub release ([CI/CD](../../docs/diagrams/10-ci-cd.md)); install it on the phone by hand. Set the server address to the Funnel address on the sign-in screen.

To set up signing once, on your PC:

```sh
keytool -genkeypair -v -keystore life.jks -alias life -keyalg RSA -keysize 4096 -validity 10000
base64 -w0 life.jks   # paste into the ANDROID_KEYSTORE_BASE64 secret
```

Then add `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (`life`) and `ANDROID_KEY_PASSWORD` as repository secrets. Keep `life.jks` in your password manager: losing it means the phone can't install updates over the old app.

## Config

| Setting | Where | Use |
| --- | --- | --- |
| `LIFE_DEV_SERVER=1` | At `cap sync`, read by `../capacitor.config.ts` | Lets the app reach a plain-HTTP dev PocketBase |
| `LIFE_VERSION` | Environment, read by `app/build.gradle`; the release workflow sets it from the tag | `versionName`, and `versionCode` as `MAJOR*10000 + MINOR*100 + PATCH`, so each release installs over the last. Without it: `dev` and `1` |
| `LIFE_KEYSTORE_FILE`, `LIFE_KEYSTORE_PASSWORD`, `LIFE_KEY_ALIAS`, `LIFE_KEY_PASSWORD` | Environment, read by `app/build.gradle`; the release workflow sets them from the secrets | Sign a release build. Without them it comes out unsigned |
| `sdk.dir` | `local.properties`, not committed: `sdk.dir=C\:\\Users\\<you>\\AppData\\Local\\Android\\Sdk` | Points Gradle at the SDK |
| Cleartext HTTP | `app/src/*/res/xml/network_security_config.xml` | Never in release builds. Debug builds allow it only to `localhost`, `127.0.0.1` and the emulator's `10.0.2.2` |
| Backups | `allowBackup`, `data_extraction_rules.xml` | Off: notes, photos and the token stay out of Google cloud backups and device transfers |
| Permissions | `AndroidManifest.xml` | `READ_CALENDAR` and `POST_NOTIFICATIONS`, both asked for when first needed |
| Server address | Sign-in screen | Kept on the device |

## Talks to

PocketBase, at the address chosen on the sign-in screen; the phone's calendars, read-only; and other apps, which share into it.
