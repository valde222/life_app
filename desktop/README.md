# Desktop shell

Tauri 2 wrapping the Angular app as the Windows app "Life". Phase 6 adds the tray icon and the Ctrl+Space capture window here.

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

## Talks to

PocketBase, at the address chosen on the sign-in screen.
