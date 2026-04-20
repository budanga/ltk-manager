import { Loader2 } from "lucide-react";

import { Progress } from "@/components";
import type { OverlayProgress } from "@/lib/tauri";
import { usePatcherSessionStore } from "@/stores";

import { useHotkeyEvents, useOverlayProgress, usePatcherError, usePatcherStatus } from "../api";

const stageLabels: Record<OverlayProgress["stage"], string> = {
  indexing: "Indexing game files...",
  collecting: "Collecting mod overrides...",
  patching: "Patching WAD files...",
  strings: "Applying string overrides...",
  complete: "Overlay built successfully!",
};

function isDeterminate(stage: OverlayProgress["stage"]) {
  return stage === "patching" || stage === "strings";
}

export function StatusBar() {
  const { data: patcherStatus } = usePatcherStatus();
  const overlayProgress = useOverlayProgress();
  usePatcherError();
  useHotkeyEvents();

  const testingProjects = usePatcherSessionStore((s) => s.testingProjects);

  const isBuilding = patcherStatus?.phase === "building";

  if (!isBuilding) return null;

  const testLabel =
    testingProjects.length === 1
      ? `Testing ${testingProjects[0].displayName}`
      : testingProjects.length > 1
        ? `Testing ${testingProjects.length} projects`
        : null;

  const stage = overlayProgress?.stage;
  const label = (stage && stageLabels[stage]) ?? "Preparing build...";
  const determinate = stage ? isDeterminate(stage) : false;
  const value =
    determinate && overlayProgress && overlayProgress.total > 0
      ? (overlayProgress.current / overlayProgress.total) * 100
      : null;
  const counter =
    determinate && overlayProgress && overlayProgress.total > 0
      ? `${overlayProgress.current} / ${overlayProgress.total}`
      : null;

  return (
    <div className="border-b-2 border-accent-500 bg-surface-950 px-4 py-2">
      <div className="flex items-center gap-3">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent-500" />
        <span className="shrink-0 text-sm font-medium text-accent-500">Building Overlay</span>
        {testLabel && (
          <span className="shrink-0 rounded-full bg-accent-500/10 px-2 py-0.5 text-xs font-medium text-accent-400">
            {testLabel}
          </span>
        )}
        <span className="text-sm text-surface-300">{label}</span>
        <div className="flex-1" />
        {counter && (
          <span className="shrink-0 text-sm text-surface-400 tabular-nums">{counter}</span>
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-3">
        <Progress.Root value={value} className="flex-1">
          <Progress.Track size="sm">
            <Progress.Indicator />
          </Progress.Track>
        </Progress.Root>
      </div>
      {overlayProgress?.currentFile && (
        <p className="mt-1 truncate text-xs text-surface-500">{overlayProgress.currentFile}</p>
      )}
    </div>
  );
}
