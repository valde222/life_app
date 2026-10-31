use std::fmt;

#[derive(Debug)]
pub enum AppError {
    MissingIcon,
    Shortcut(String),
    Tauri(tauri::Error),
}

impl fmt::Display for AppError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::MissingIcon => write!(formatter, "the app bundle has no window icon"),
            AppError::Shortcut(reason) => {
                write!(formatter, "the capture shortcut failed: {reason}")
            }
            AppError::Tauri(error) => write!(formatter, "{error}"),
        }
    }
}

impl std::error::Error for AppError {}

impl From<tauri::Error> for AppError {
    fn from(error: tauri::Error) -> Self {
        AppError::Tauri(error)
    }
}
