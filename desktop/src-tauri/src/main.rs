// Hides the console window behind the app in Windows release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    if let Err(error) = life_lib::run() {
        eprintln!("Life could not start: {error}");
        std::process::exit(1);
    }
}
