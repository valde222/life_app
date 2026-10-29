use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent};
use tauri_plugin_global_shortcut::ShortcutState;

const MAIN_WINDOW: &str = "main";
const CAPTURE_WINDOW: &str = "capture";
const CAPTURE_SHORTCUT: &str = "ctrl+space";

fn show_main(app: &AppHandle) {
    if let Some(window) = app.get_webview_window(MAIN_WINDOW) {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

fn show_capture(app: &AppHandle) {
    let window = match app.get_webview_window(CAPTURE_WINDOW) {
        Some(window) => window,
        None => {
            let built = WebviewWindowBuilder::new(app, CAPTURE_WINDOW, WebviewUrl::App("index.html".into()))
                .title("Capture")
                .inner_size(480.0, 320.0)
                .resizable(false)
                .always_on_top(true)
                .skip_taskbar(true)
                .center()
                .build();
            match built {
                Ok(window) => window,
                Err(error) => {
                    log::error!("could not open the capture window: {error}");
                    return;
                }
            }
        }
    };
    let _ = window.show();
    let _ = window.set_focus();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| show_main(app)))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_shortcuts([CAPTURE_SHORTCUT])
                .expect("the capture shortcut is valid")
                .with_handler(|app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        show_capture(app);
                    }
                })
                .build(),
        )
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            let show = MenuItem::with_id(app, "show", "Show Life", true, None::<&str>)?;
            let capture = MenuItem::with_id(app, "capture", "Capture", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &capture, &quit])?;
            TrayIconBuilder::new()
                .icon(app.default_window_icon().cloned().expect("the bundle has an icon"))
                .tooltip("Life")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => show_main(app),
                    "capture" => show_capture(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running the Life desktop app");
}
