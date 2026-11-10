# Desktop shell

Tauri 2 wrapping the Angular app as the Windows app "Life": a tray icon keeps it running when the window is closed, Ctrl+Space anywhere opens a small capture window, and a note's files open in their default Windows app. See the [Tauri modules](../docs/diagrams/03f-tauri-modules.md).

## Run in development

Start the [dev environment](../README.md), then from WSL, in `desktop/`:

```sh
cmd.exe /c "cargo tauri dev"
```

Tests, from WSL in `desktop/src-tauri/`: `cmd.exe /c "cargo fmt --check"`, `cmd.exe /c "cargo clippy --all-targets -- -D warnings"` and `cmd.exe /c "cargo test"`. They need the web files from `npm run build` in `app/`.

## Run in production

Build the web files in WSL, then package them on Windows, which needs no Node. From WSL, in `app/`:

```sh
npm run build:desktop
```

The installer lands in `desktop/src-tauri/target/release/bundle/nsis/`. A local build says version `0.1.0` and never offers updates; install the one from a GitHub release instead ([CI/CD](../docs/diagrams/10-ci-cd.md)). Set the server address to the Funnel address on the sign-in screen. To start the app with Windows, put a shortcut to `Life.exe` in `shell:startup`.

## Updates

A release build checks `latest.json` on the newest GitHub release when it starts and every six hours. If there's a newer version it asks; "Install and restart" downloads the installer, checks its signature, installs it and opens Life again. "Later" asks again at the next check. The local copy, unsynced changes included, stays in WebView2's folder for `dk.ottes.life`, which the installer doesn't touch.

The repo must be public, because the app reads the release without a GitHub login. To set up signing once, on your PC:

```sh
cargo tauri signer generate -w life-updater.key
```

Put the public key in `plugins.updater.pubkey` in `src-tauri/tauri.conf.json`, and the private key file's contents and its password in the `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` repository secrets. Keep both in your password manager: without them, installed apps can't take another update and have to be reinstalled by hand.

## Config

| Setting | Where |
| --- | --- |
| `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Environment; the release workflow sets them from the secrets. Sign the installer for the updater |
| Updater public key, install mode | `plugins.updater` in `src-tauri/tauri.conf.json` |
| Updater address, version | Added by the release workflow with `cargo tauri build --config`: `https://github.com/<repo>/releases/latest/download/latest.json` and the tag's version |
| Web files | `frontendDist` in `src-tauri/tauri.conf.json`, pointing at `app/dist/app/browser`. `beforeBuildCommand` stays empty |
| App id, window size | `src-tauri/tauri.conf.json` |
| Icons | Generated from `docs/brand/icon.svg` with `cargo tauri icon` |
| Content Security Policy | `app.security.csp` in `src-tauri/tauri.conf.json`, the same policy as `app/src/index.html` |
| IPC permissions | `src-tauri/capabilities/`: `default.json` (the capture window hides itself) and `open-files.json` (the main window opens a note's file). App commands need a permission, declared in `build.rs` |
| Server address | Sign-in screen, kept on the device |

## Talks to

PocketBase, at the address chosen on the sign-in screen, also to download a note's file when you open it; GitHub Releases, for updates; the default Windows app for each file type.
