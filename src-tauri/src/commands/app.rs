use crate::error::IpcResult;
use serde::Serialize;
use ts_rs::TS;

#[derive(Debug, Serialize, TS)]
#[ts(export)]
#[serde(rename_all = "camelCase")]
pub struct AppInfo {
    pub name: String,
    pub version: String,
    pub log_file_path: Option<String>,
    pub os: String,
    pub arch: String,
}

/// Get basic app information.
#[tauri::command]
pub fn get_app_info() -> IpcResult<AppInfo> {
    let log_file_path = crate::logging::default_log_dir()
        .map(|p: std::path::PathBuf| p.to_string_lossy().into_owned());

    IpcResult::ok(AppInfo {
        name: "LTK Manager".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        log_file_path,
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
    })
}
