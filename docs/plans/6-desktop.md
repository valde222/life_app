# 6 · Desktop

**Goal:** the same app, laid out for a big screen inside Tauri, with capture from anywhere on Ctrl+Space and a tray icon so it keeps running.

**Covers:** R1 (desktop hotkey), R2, R15 (badge on desktop), T16; screens Desktop*, DesktopShortcuts, DesktopCaptureMore.

## Layout (one Angular app, from 900px wide)

- **Sidebar** (240px, `sidebar`): Capture with its "Ctrl Space" key, Today, Agenda, Inbox with badge, Search; Lists with Edit and the group tree (open and close, list swatches, "+ New list", "+ New group"); at the bottom Settings, sync state ("Synced" / "Offline, N waiting") and "?" for shortcuts. The bottom nav is hidden.
- **Content** with 40px padding.
- **Detail pane** (400px) on the right: a todo, note or event clicked in the content opens here instead of taking over the screen. Closed with Esc.
- Sheets become centred dialogs.
- Below 900px nothing changes: the phone layout.

## Keyboard

- Anywhere: Ctrl+Space capture, Ctrl+K search, ? shortcuts. Capture: Enter save, Ctrl+D add details, Esc close.
- Inbox: ↑ ↓ next item, M move to a list, T put on Today, D pick a date, Enter open.
- Agenda: ← → previous or next day, T today.
- The "Keyboard shortcuts." overlay lists them; they never appear as hint text elsewhere.

## Tauri

- `tauri-plugin-global-shortcut`: Ctrl+Space anywhere shows a small always-on-top capture window (`/capture`), focused; Save puts the item in the Inbox and hides it; Esc hides it.
- Tray icon (Show Life, Quit). Closing the main window hides it to the tray, so the hotkey keeps working.
- `tauri-plugin-single-instance`: a second launch focuses the running app.
- Both windows share the local copy (same origin), so the main window sees a capture at once.

## Steps

- [ ] Desktop layout: sidebar, content, detail pane, dialogs
- [ ] Keyboard shortcuts and the overlay
- [ ] Capture route for the capture window
- [ ] Tauri: global shortcut, capture window, tray, single instance
- [ ] e2e T16 (web side: Ctrl+Space and the capture window route)

## Done when

T16 passes, and on Windows Ctrl+Space from another app opens capture and Save lands in the Inbox.
