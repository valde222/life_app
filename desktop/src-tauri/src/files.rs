use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use reqwest::redirect::Policy;
use tauri::{AppHandle, Url};
use tauri_plugin_opener::OpenerExt;

const MAX_BYTES: u64 = 50 * 1024 * 1024;
const MAX_NAME_CHARS: usize = 120;
const KEEP_OPENED: Duration = Duration::from_secs(24 * 60 * 60);
const DEV_HOSTS: [&str; 2] = ["localhost", "127.0.0.1"];
const RESERVED: [&str; 22] = [
    "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8",
    "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
];

#[tauri::command]
pub async fn open_file(app: AppHandle, url: String, name: String) -> Result<(), String> {
    let url = allowed_url(&url).ok_or("not an address Life may download from")?;
    let opened = std::env::temp_dir().join("life-files");
    remove_older_than_a_day(&opened);
    let path = download(url, &opened, &safe_name(&name))
        .await
        .map_err(|error| format!("could not download the file: {error}"))?;
    if let Err(error) = mark_as_downloaded(&path) {
        log::warn!("could not mark {} as downloaded: {error}", path.display());
    }
    app.opener()
        .open_path(path.to_string_lossy(), None::<&str>)
        .map_err(|error| format!("could not open the file: {error}"))
}

fn allowed_url(url: &str) -> Option<Url> {
    let url = Url::parse(url).ok()?;
    let host = url.host_str()?.to_ascii_lowercase();
    let allowed =
        url.scheme() == "https" || (url.scheme() == "http" && DEV_HOSTS.contains(&host.as_str()));
    allowed.then_some(url)
}

fn safe_name(name: &str) -> String {
    let base = name.rsplit(['/', '\\']).next().unwrap_or_default();
    let cleaned: String = base
        .chars()
        .map(|c| match c {
            '<' | '>' | ':' | '"' | '|' | '?' | '*' => '_',
            c if c.is_control() => '_',
            c => c,
        })
        .collect();
    let trimmed = cleaned
        .trim()
        .trim_start_matches('.')
        .trim_end_matches(['.', ' ']);
    let short: String = trimmed
        .chars()
        .rev()
        .take(MAX_NAME_CHARS)
        .collect::<Vec<_>>()
        .into_iter()
        .rev()
        .collect();
    let stem = short
        .split('.')
        .next()
        .unwrap_or_default()
        .to_ascii_uppercase();
    match short.as_str() {
        "" => "file".into(),
        _ if RESERVED.contains(&stem.as_str()) => format!("_{short}"),
        _ => short,
    }
}

async fn download(url: Url, opened: &Path, name: &str) -> Result<PathBuf, String> {
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?
        .as_millis();
    let folder = opened.join(millis.to_string());
    fs::create_dir_all(&folder).map_err(|error| error.to_string())?;
    let path = folder.join(name);
    // reqwest comes in through the updater with rustls but no crypto provider; the updater installs ring the same way.
    if rustls::crypto::CryptoProvider::get_default().is_none() {
        let _ = rustls::crypto::ring::default_provider().install_default();
    }
    let client = reqwest::Client::builder()
        .redirect(Policy::none())
        .build()
        .map_err(|error| error.to_string())?;
    let mut response = client
        .get(url)
        .send()
        .await
        .and_then(reqwest::Response::error_for_status)
        .map_err(|error| error.to_string())?;
    let mut file = fs::File::create(&path).map_err(|error| error.to_string())?;
    let mut total: u64 = 0;
    while let Some(chunk) = response.chunk().await.map_err(|error| error.to_string())? {
        total += chunk.len() as u64;
        if total > MAX_BYTES {
            return Err(format!("larger than {MAX_BYTES} bytes"));
        }
        file.write_all(&chunk).map_err(|error| error.to_string())?;
    }
    Ok(path)
}

// Browsers tag downloads this way, so Windows asks before running a program and Office opens documents in Protected View: https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-fscc/6e3f7352-d11c-4d76-8c39-2516a9df36e8
#[cfg(windows)]
fn mark_as_downloaded(path: &Path) -> std::io::Result<()> {
    let mut stream = path.as_os_str().to_owned();
    stream.push(":Zone.Identifier");
    fs::write(stream, "[ZoneTransfer]\r\nZoneId=3\r\n")
}

#[cfg(not(windows))]
fn mark_as_downloaded(_path: &Path) -> std::io::Result<()> {
    Ok(())
}

fn remove_older_than_a_day(opened: &Path) {
    let Ok(folders) = fs::read_dir(opened) else {
        return;
    };
    for folder in folders.flatten() {
        let old = folder
            .metadata()
            .and_then(|metadata| metadata.modified())
            .ok()
            .and_then(|modified| modified.elapsed().ok())
            .is_some_and(|age| age > KEEP_OPENED);
        if old && let Err(error) = fs::remove_dir_all(folder.path()) {
            log::warn!("could not clear {}: {error}", folder.path().display());
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{allowed_url, safe_name};

    #[test]
    fn downloads_only_over_https_or_from_the_dev_server() {
        assert!(
            allowed_url("https://life.tail1234.ts.net/api/files/notes/a/b.pdf?token=x").is_some()
        );
        assert!(allowed_url("http://localhost:8090/api/files/notes/a/b.pdf").is_some());
        assert!(allowed_url("http://127.0.0.1:8090/b.pdf").is_some());
        assert!(allowed_url("http://life.tail1234.ts.net/b.pdf").is_none());
        assert!(allowed_url("file:///C:/Windows/System32/cmd.exe").is_none());
        assert!(allowed_url("ftp://example.com/b.pdf").is_none());
        assert!(allowed_url("not a url").is_none());
    }

    #[test]
    fn keeps_readable_names() {
        assert_eq!(
            safe_name("Lejekontrakt Æblegrød.pdf"),
            "Lejekontrakt Æblegrød.pdf"
        );
    }

    #[test]
    fn names_cannot_leave_the_folder_or_trip_windows() {
        assert_eq!(safe_name("../../Windows/evil.exe"), "evil.exe");
        assert_eq!(safe_name("..\\..\\evil.exe"), "evil.exe");
        assert_eq!(safe_name("C:evil.exe"), "C_evil.exe");
        assert_eq!(safe_name("a<b>?.txt"), "a_b__.txt");
        assert_eq!(safe_name("...hidden"), "hidden");
        assert_eq!(safe_name("trailing. "), "trailing");
        assert_eq!(safe_name("CON.txt"), "_CON.txt");
        assert_eq!(safe_name("nul"), "_nul");
        assert_eq!(safe_name(".."), "file");
        assert_eq!(safe_name(""), "file");
    }

    #[test]
    fn long_names_keep_their_end() {
        let long = format!("{}.pdf", "a".repeat(300));
        let safe = safe_name(&long);
        assert_eq!(safe.chars().count(), 120);
        assert!(safe.ends_with(".pdf"));
    }
}
