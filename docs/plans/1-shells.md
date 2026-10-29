# 1 · Android and desktop shells

**Goal:** the Angular build runs inside Capacitor on Android and Tauri on Windows, pointed at a configurable PocketBase URL.

**Covers:** decisions 3, 4, 15.

## Approach

- PocketBase URL: build-time `environment` default, overridable on the sign-in screen and stored locally, so one APK works with the dev server and the Pi.
- **Android:** `@capacitor/android` in `app/`, app id `dk.ottes.life`, `android/` committed. Cleartext HTTP allowed only for local dev addresses. Build: `npx cap sync android` in WSL, `gradlew.bat assembleDebug` on Windows.
- **Desktop:** `desktop/src-tauri` (Tauri 2), `frontendDist: ../../app/dist/app/browser`, empty `beforeBuildCommand`. Build: `cargo tauri build` on Windows via `cmd.exe`. Tray icon and Ctrl+Space come in phase 6.
- `npm run build:android` and `npm run build:desktop` in `app/` wrap the WSL and Windows halves.

## Steps

- [x] Capacitor added, Android project generated, `app/android/README.md`
- [ ] Tauri shell, `desktop/README.md`
- [ ] Both build locally once

## Done when

A debug APK and the Windows app are built from `main`, and both sign in to the dev PocketBase.
