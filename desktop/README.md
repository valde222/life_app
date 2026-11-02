# Desktop shell

Tauri 2 wrapping the Angular app as the Windows app "Life": a tray icon keeps it running when the window is closed, and Ctrl+Space anywhere opens a small capture window. See the [Tauri modules](../docs/diagrams/03f-tauri-modules.md).

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

The installer lands in `desktop/src-tauri/target/release/bundle/nsis/`; a `v*` tag also attaches one to a GitHub release ([CI/CD](../docs/diagrams/10-ci-cd.md)). Set the server address to the Funnel address on the sign-in screen. To start the app with Windows, put a shortcut to `Life.exe` in `shell:startup`.

## Config

No environment variables.

| Setting | Where |
| --- | --- |
| Web files | `frontendDist` in `src-tauri/tauri.conf.json`, pointing at `app/dist/app/browser`. `beforeBuildCommand` stays empty |
| App id, window size | `src-tauri/tauri.conf.json` |
| Icons | Generated from `docs/brand/icon.svg` with `cargo tauri icon` |
| Content Security Policy | `app.security.csp` in `src-tauri/tauri.conf.json`, the same policy as `app/src/index.html` |
| IPC permissions | `src-tauri/capabilities/default.json` |
| Server address | Sign-in screen, kept on the device |

## Talks to

PocketBase, at the address chosen on the sign-in screen.
