import { Button, Slider } from "@/components";
import type { ZoomLevel } from "@/stores";
import { useSetZoomLevel, useZoomLevel, VALID_ZOOM_LEVELS } from "@/stores";

const MARKS = VALID_ZOOM_LEVELS.map((level) => ({ value: level, label: `${level}%` }));

export function ZoomLevelPicker() {
  const zoomLevel = useZoomLevel();
  const setZoomLevel = useSetZoomLevel();

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-surface-200">Zoom level</span>

      <div className="rounded-lg bg-surface-800 px-6 py-5">
        <div className="mb-3 flex justify-between">
          <span className="text-xs font-medium text-surface-300">Dense</span>
          <span className="text-xs font-medium text-surface-300">Default</span>
          <span className="text-xs font-medium text-surface-300">Spacious</span>
        </div>

        <Slider
          value={zoomLevel}
          onValueChange={(v) => setZoomLevel(v as ZoomLevel)}
          min={70}
          max={130}
          step={10}
          marks={MARKS}
          aria-label="Zoom level"
        />

        {zoomLevel !== 100 && (
          <div className="mt-4 flex justify-end">
            <Button compact onClick={() => setZoomLevel(100)}>
              Reset
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
