use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder, Window};

pub const MAIN_WINDOW: &str = "main";
pub const CAPTURE_WINDOW: &str = "capture";

pub fn show_main(app: &AppHandle) {
    if let Some(window) = app.get_webview_window(MAIN_WINDOW) {
        report("show the main window", window.show());
        report("unminimize the main window", window.unminimize());
        report("focus the main window", window.set_focus());
    }
}

pub fn show_capture(app: &AppHandle) {
    let window = match app.get_webview_window(CAPTURE_WINDOW) {
        Some(window) => window,
        None => match build_capture(app) {
            Ok(window) => window,
            Err(error) => {
                log::error!("could not open the capture window: {error}");
                return;
            }
        },
    };
    report("show the capture window", window.show());
    report("focus the capture window", window.set_focus());
}

pub fn hide_instead_of_closing(window: &Window) {
    report("hide a window", window.hide());
}

fn build_capture(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    WebviewWindowBuilder::new(app, CAPTURE_WINDOW, WebviewUrl::App("index.html".into()))
        .title("Capture")
        .inner_size(480.0, 320.0)
        .resizable(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .center()
        .build()
}

fn report(action: &str, result: tauri::Result<()>) {
    if let Err(error) = result {
        log::warn!("could not {action}: {error}");
    }
}
