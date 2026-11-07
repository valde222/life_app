# Ready for daily use

What the app needs before Valdemar deploys it and relies on it: no silent loss of unsent changes, problems that can be read on the device, a version on every build, and updates that don't mean hunting for files on GitHub. Branch `release/daily-use`, merged to `main` and tagged `v1.0.0`.

## Behaviour

- **Sign out with unsent changes:** with changes still waiting, the first press of Sign out turns the button into "Sign out and lose N changes"; only a second press signs out. With nothing waiting it signs out at once, as before. Same two-press pattern as Empty now and Delete list.
- **Error log:** `logError` also keeps the last 100 entries (time, context, message) in `localStorage`, and an Angular `ErrorHandler` sends uncaught errors there. Settings › Error log lists them, newest first, with Copy and Clear. A change the server rejects already goes through `logError`, so it shows up here.
- **Version:** release builds take their version from the tag. Tags are `vMAJOR.MINOR.PATCH`; the release workflow fails on any other `v*` tag, because the desktop updater needs a semver.
  - Web: `ng build --define` sets `LIFE_VERSION`; Settings shows it as Version. Local builds say `dev`.
  - Android: `LIFE_VERSION` sets `versionName`, and `versionCode` is `MAJOR*10000 + MINOR*100 + PATCH`, so every release installs over the last. Local builds stay `1` / `dev`.
  - Desktop: the workflow passes the version to `cargo tauri build --config`.
- **Desktop updates:** Tauri's updater plugin, run from Rust so the main window keeps no IPC. On start and every six hours it reads `latest.json` from the newest GitHub release. If there's a newer version, a native dialog asks "Install and restart" or "Later"; Later leaves a tray item "Install update X". Installing downloads the signed installer, runs it passively and restarts. The local copy lives in WebView2's folder for `dk.ottes.life`, which the installer leaves alone.
- **Android updates:** no code. Obtainium on the phone watches the GitHub releases and installs each new APK over the old one; same signing key, so the local copy stays.
- **Server updates:** the deploy README takes a backup by hand before `docker compose up -d --build`, so a rollback across a migration has something to restore.

## Decisions

- Updates on desktop are checked and installed from Rust, not from the web view: the security audit left the main window without IPC, and an update check needs none.
- Android uses Obtainium rather than an in-app updater: Android won't let an app install an APK silently anyway, and Obtainium already does the check, download and install prompt.
- Tags move from `v0.N-name` to semver `vMAJOR.MINOR.PATCH`, starting at `v1.0.0`.

## Steps

- [x] Sign out asks again when changes are waiting
- [ ] Error log: kept on the device, uncaught errors included, shown in Settings
- [ ] Version from the tag: web, Android, desktop; shown in Settings; release workflow checks the tag
- [ ] Desktop updater: plugin, check on start and every six hours, dialog and tray item, signed `latest.json` in the release
- [ ] Docs: deploy README (update with a backup first, `age` on the PC, installing the apps), Android README (Obtainium), desktop README (updates), diagrams
- [ ] `docs/deploy-checklist.md`: every manual step before and after the first deploy
- [ ] Tests, lint, clippy pass; merge to `main`; tag `v1.0.0`
