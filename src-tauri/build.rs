fn main() {
    // Ensure the frontendDist path exists so tauri::generate_context!() doesn't
    // panic during `cargo package --verify` (which builds from an extracted tarball
    // where ../dist doesn't exist).
    let dist = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../dist");
    if !dist.exists() {
        std::fs::create_dir_all(&dist).unwrap();
        std::fs::write(dist.join("index.html"), "").unwrap();
    }

    tauri_build::build()
}
