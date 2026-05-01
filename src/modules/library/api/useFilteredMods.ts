import { useMemo } from "react";

import type { InstalledMod } from "@/lib/tauri";
import { sortMods } from "@/modules/library/utils";
import { getEffectiveChampions } from "@/modules/library/utils/sorting";
import { useLibraryFilterStore } from "@/stores";

import { useAllModWadReports } from "./useModWadReport";

export function useFilteredMods(mods: InstalledMod[], searchQuery: string): InstalledMod[] {
  const { selectedTags, selectedChampions, selectedMaps, sort } = useLibraryFilterStore();
  const { data: wadReports } = useAllModWadReports();

  return useMemo(() => {
    let result = mods;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (mod) => mod.displayName.toLowerCase().includes(q) || mod.name.toLowerCase().includes(q),
      );
    }

    if (selectedTags.size > 0) {
      result = result.filter((mod) => mod.tags.some((t) => selectedTags.has(t)));
    }
    if (selectedChampions.size > 0) {
      result = result.filter((mod) => {
        const report = wadReports ? wadReports[mod.id] : undefined;
        const champs = getEffectiveChampions(mod, report);
        return champs.some((c) => selectedChampions.has(c));
      });
    }
    if (selectedMaps.size > 0) {
      result = result.filter((mod) => mod.maps.some((m) => selectedMaps.has(m)));
    }

    return sortMods(result, sort);
  }, [mods, searchQuery, selectedTags, selectedChampions, selectedMaps, sort, wadReports]);
}
