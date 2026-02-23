import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

import type { InstallProgress, MigrationProgress } from "@/lib/tauri";

export function useMigrationProgress() {
  const [progress, setProgress] = useState<MigrationProgress | null>(null);

  useEffect(() => {
    let unlistenMigration: UnlistenFn | null = null;
    let unlistenInstall: UnlistenFn | null = null;

    listen<MigrationProgress>("migration-progress", (event) => {
      setProgress(event.payload);
    }).then((fn) => {
      unlistenMigration = fn;
    });

    listen<InstallProgress>("install-progress", (event) => {
      setProgress({
        phase: "installing",
        current: event.payload.current,
        total: event.payload.total,
        currentFile: event.payload.currentFile,
      });
    }).then((fn) => {
      unlistenInstall = fn;
    });

    return () => {
      unlistenMigration?.();
      unlistenInstall?.();
    };
  }, []);

  function reset() {
    setProgress(null);
  }

  return { progress, reset };
}
