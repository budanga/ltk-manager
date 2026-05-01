import { useMemo } from "react";

import type { InstalledMod } from "@/lib/tauri";
import { getEffectiveChampions } from "@/modules/library/utils/sorting";

import { useAllModWadReports } from "./useModWadReport";

export interface FilterOptions {
  tags: string[];
  champions: string[];
  maps: string[];
}

export function useFilterOptions(mods: InstalledMod[]): FilterOptions {
  const { data: wadReports } = useAllModWadReports();

  return useMemo(() => {
    const tags = new Set<string>();
    const champions = new Set<string>();
    const maps = new Set<string>();

    for (const mod of mods) {
      for (const t of mod.tags) tags.add(t);
      const report = wadReports ? wadReports[mod.id] : undefined;
      const champs = getEffectiveChampions(mod, report);
      for (const c of champs) champions.add(c);
      for (const m of mod.maps) maps.add(m);
    }

    return {
      tags: [...tags].sort(),
      champions: [...champions].sort(),
      maps: [...maps].sort(),
    };
  }, [mods, wadReports]);
}
