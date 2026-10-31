# Desktop shell

Tauri 2 wrapping the Angular app as the Windows app "Life": a tray icon keeps it running when the window is closed, and Ctrl+Space anywhere opens a small capture window (R1).

## Build

Build the web files in WSL, then package them on Windows (Windows needs no Node):

```sh
cd app && npm run build:desktop
```

That runs `npm run build`, then `cargo tauri build` in `desktop/` through `cmd.exe`. The installer lands in `src-tauri/target/release/bundle/nsis/`.

For a window on the dev server instead: start the dev environment, then `cmd.exe /c "cargo tauri dev"` in `desktop/`.

## Config

| Setting | Where |
| --- | --- |
| Web files | `frontendDist` in `src-tauri/tauri.conf.json` → `app/dist/app/browser`. `beforeBuildCommand` stays empty |
| App id, window size | `src-tauri/tauri.conf.json` |
| Icons | Generated from `docs/brand/icon.svg` with `cargo tauri icon` |
| Server address | Sign-in screen, kept on the device |
| Content Security Policy | `app.security.csp` in `src-tauri/tauri.conf.json`, the same policy as `app/src/index.html`: scripts only from the app, network only to HTTPS (or plain HTTP on localhost) |
| IPC permissions | `src-tauri/capabilities/default.json`: only the capture window, and it may only hide itself. The main window gets no IPC; there are no custom commands |

## Native parts

| Part | What it does |
| --- | --- |
| Tray icon | Show Life, Capture, Quit. Closing a window hides it; Quit ends the app |
| `tauri-plugin-global-shortcut` | Ctrl+Space anywhere shows the always-on-top capture window (`/capture` in the app), which hides itself after Save or Esc |
| `tauri-plugin-single-instance` | A second launch brings the running app forward |

The Rust side is `src-tauri/src/`: `lib.rs` wires the app, `hotkey.rs`, `tray.rs` and `windows.rs` each own one part, and `error.rs` is the one error type. Clippy refuses `unwrap` and `expect`; CI runs `cargo fmt --check`, `cargo clippy -- -D warnings` and `cargo test`.

To start it with Windows, put a shortcut to `Life.exe` in `shell:startup`.

## Talks to

PocketBase, at the address chosen on the sign-in screen.
