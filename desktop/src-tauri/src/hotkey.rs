use tauri::Wry;
use tauri::plugin::TauriPlugin;
use tauri_plugin_global_shortcut::{Builder, ShortcutState};

use crate::error::AppError;
use crate::windows::show_capture;

pub const CAPTURE_SHORTCUT: &str = "ctrl+space";

pub fn plugin() -> Result<TauriPlugin<Wry>, AppError> {
    let plugin = Builder::new()
        .with_shortcuts([CAPTURE_SHORTCUT])
        .map_err(|error| AppError::Shortcut(error.to_string()))?
        .with_handler(|app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                show_capture(app);
            }
        })
        .build();
    Ok(plugin)
}
