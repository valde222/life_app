fn main() {
    let attributes = tauri_build::Attributes::new()
        .app_manifest(tauri_build::AppManifest::new().commands(&["open_file"]));
    if let Err(error) = tauri_build::try_build(attributes) {
        panic!("tauri build failed: {error:#}");
    }
}
