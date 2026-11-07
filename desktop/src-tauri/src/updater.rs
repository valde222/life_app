use std::time::Duration;

use tauri::AppHandle;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons};
use tauri_plugin_updater::UpdaterExt;

const CHECK_EVERY: Duration = Duration::from_secs(6 * 60 * 60);

pub fn watch(app: &AppHandle) {
    if cfg!(debug_assertions) {
        return;
    }
    let app = app.clone();
    std::thread::spawn(move || {
        loop {
            if let Err(error) = tauri::async_runtime::block_on(offer_update(&app)) {
                log::warn!("update check failed: {error}");
            }
            std::thread::sleep(CHECK_EVERY);
        }
    });
}

async fn offer_update(app: &AppHandle) -> tauri_plugin_updater::Result<()> {
    let Some(update) = app.updater()?.check().await? else {
        return Ok(());
    };
    let install = app
        .dialog()
        .message(prompt(&update.version))
        .title("Update Life")
        .buttons(MessageDialogButtons::OkCancelCustom(
            "Install and restart".into(),
            "Later".into(),
        ))
        .blocking_show();
    if install {
        update.download_and_install(|_, _| {}, || {}).await?;
        app.restart();
    }
    Ok(())
}

fn prompt(version: &str) -> String {
    format!(
        "Life {version} is ready. Install it now? Life closes, updates and opens again; changes not yet synced are kept."
    )
}

#[cfg(test)]
mod tests {
    use super::prompt;

    #[test]
    fn prompt_names_the_new_version() {
        assert!(prompt("1.2.0").starts_with("Life 1.2.0 is ready."));
    }
}
