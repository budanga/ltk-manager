import { create } from "zustand";
import { persist } from "zustand/middleware";

type ZoomLevel = 70 | 80 | 90 | 100 | 110 | 120 | 130;
type ReduceMotion = "system" | "on" | "off";

interface DisplayStore {
  zoomLevel: ZoomLevel;
  reduceMotion: ReduceMotion;
  setZoomLevel: (zoomLevel: ZoomLevel) => void;
  setReduceMotion: (reduceMotion: ReduceMotion) => void;
}

const VALID_ZOOM_LEVELS: readonly ZoomLevel[] = [70, 80, 90, 100, 110, 120, 130];

const DENSITY_TO_ZOOM: Record<string, ZoomLevel> = {
  compact: 70,
  normal: 80,
  spacious: 100,
};

export const useDisplayStore = create<DisplayStore>()(
  persist(
    (set) => ({
      zoomLevel: 100,
      reduceMotion: "system",
      setZoomLevel: (zoomLevel) => set({ zoomLevel }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
    }),
    {
      name: "ltk-display-prefs",
      version: 1,
      migrate: (persisted, version) => {
        if (version === 0) {
          const state = persisted as Record<string, unknown>;
          const oldDensity = state.density as string | undefined;
          const zoomLevel = oldDensity ? (DENSITY_TO_ZOOM[oldDensity] ?? 100) : 100;
          const { density: _, ...rest } = state;
          return { ...rest, zoomLevel } as DisplayStore;
        }
        return persisted as DisplayStore;
      },
    },
  ),
);

export { VALID_ZOOM_LEVELS };
export type { ZoomLevel };
export const useZoomLevel = () => useDisplayStore((s) => s.zoomLevel);
export const useSetZoomLevel = () => useDisplayStore((s) => s.setZoomLevel);
export const useReduceMotion = () => useDisplayStore((s) => s.reduceMotion);
export const useSetReduceMotion = () => useDisplayStore((s) => s.setReduceMotion);
