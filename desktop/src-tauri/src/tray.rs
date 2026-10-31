use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{App, AppHandle};

use crate::error::AppError;
use crate::windows::{show_capture, show_main};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TrayAction {
    Show,
    Capture,
    Quit,
}

impl TrayAction {
    const ALL: [TrayAction; 3] = [TrayAction::Show, TrayAction::Capture, TrayAction::Quit];

    pub fn id(self) -> &'static str {
        match self {
            TrayAction::Show => "show",
            TrayAction::Capture => "capture",
            TrayAction::Quit => "quit",
        }
    }

    pub fn label(self) -> &'static str {
        match self {
            TrayAction::Show => "Show Life",
            TrayAction::Capture => "Capture",
            TrayAction::Quit => "Quit",
        }
    }

    pub fn from_id(id: &str) -> Option<TrayAction> {
        TrayAction::ALL.into_iter().find(|action| action.id() == id)
    }
}

pub fn build(app: &App) -> Result<(), AppError> {
    let items = TrayAction::ALL
        .into_iter()
        .map(|action| MenuItem::with_id(app, action.id(), action.label(), true, None::<&str>))
        .collect::<tauri::Result<Vec<_>>>()?;
    let entries: Vec<&dyn tauri::menu::IsMenuItem<tauri::Wry>> = items
        .iter()
        .map(|item| item as &dyn tauri::menu::IsMenuItem<tauri::Wry>)
        .collect();
    let menu = Menu::with_items(app, &entries)?;
    let icon = app
        .default_window_icon()
        .cloned()
        .ok_or(AppError::MissingIcon)?;
    TrayIconBuilder::new()
        .icon(icon)
        .tooltip("Life")
        .menu(&menu)
        .on_menu_event(|app, event| {
            if let Some(action) = TrayAction::from_id(event.id.as_ref()) {
                run(app, action);
            }
        })
        .build(app)?;
    Ok(())
}

fn run(app: &AppHandle, action: TrayAction) {
    match action {
        TrayAction::Show => show_main(app),
        TrayAction::Capture => show_capture(app),
        TrayAction::Quit => app.exit(0),
    }
}

#[cfg(test)]
mod tests {
    use super::TrayAction;

    #[test]
    fn every_menu_id_maps_back_to_its_action() {
        for action in TrayAction::ALL {
            assert_eq!(TrayAction::from_id(action.id()), Some(action));
        }
    }

    #[test]
    fn unknown_menu_ids_do_nothing() {
        assert_eq!(TrayAction::from_id("settings"), None);
        assert_eq!(TrayAction::from_id(""), None);
    }

    #[test]
    fn menu_reads_show_capture_quit() {
        let labels: Vec<_> = TrayAction::ALL.into_iter().map(TrayAction::label).collect();
        assert_eq!(labels, ["Show Life", "Capture", "Quit"]);
    }
}
