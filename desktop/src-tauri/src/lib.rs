mod error;
mod hotkey;
mod tray;
mod windows;

use tauri::WindowEvent;

pub use error::AppError;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() -> Result<(), AppError> {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            windows::show_main(app)
        }))
        .plugin(hotkey::plugin()?)
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            tray::build(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                windows::hide_instead_of_closing(window);
            }
        })
        .run(tauri::generate_context!())?;
    Ok(())
}
