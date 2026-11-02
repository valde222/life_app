# Tauri modules

The Rust modules of the desktop shell in `desktop/src-tauri/src/`, the plugins they use, and where they meet the Angular app.

```mermaid
flowchart LR
  main["main.rs<br/>starts the app"] --> lib["lib.rs: wires everything<br/>plugin: single-instance<br/>plugin: log, debug builds only"]
  lib --> hotkey["hotkey.rs: Ctrl+Space<br/>plugin: global-shortcut"]
  lib --> tray["tray.rs<br/>Show Life, Capture, Quit"]
  hotkey --> windows["windows.rs<br/>show, hide, build capture"]
  tray --> windows
  lib --> windows
  windows -- "main and capture webviews" --> angular["Angular app<br/>core/platform/desktop-shell.ts"]
```

- There are no custom commands: the only IPC is the capture window hiding itself (`capabilities/default.json`). `error.rs` holds `AppError`, used by `lib`, `hotkey` and `tray`.
- Closing a window hides it; only Tray › Quit ends the app.
