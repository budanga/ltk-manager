import { useQuery } from "@tanstack/react-query";

import { api, type AppError, type ModWadReport } from "@/lib/tauri";
import { unwrapForQuery } from "@/utils/query";

import { libraryKeys } from "./keys";

/**
 * Batch-fetch all cached WAD footprint reports in a single IPC call.
 * Individual components select their own mod's entry via `useModWadReport`.
 */
export function useAllModWadReports() {
  return useQuery<Record<string, ModWadReport>, AppError>({
    queryKey: libraryKeys.wadReports(),
    queryFn: async () => {
      const result = await api.getAllModWadReports();
      return unwrapForQuery(result);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to read the cached WAD footprint report for a single mod.
 *
 * Returns `null` when the mod has never been analyzed nor included in a
 * successful patch run. Reads from the shared batch query — no extra IPC call.
 */
export function useModWadReport(modId: string) {
  return useQuery<Record<string, ModWadReport>, AppError, ModWadReport | null>({
    queryKey: libraryKeys.wadReports(),
    queryFn: async () => {
      const result = await api.getAllModWadReports();
      return unwrapForQuery(result);
    },
    staleTime: 5 * 60 * 1000,
    select: (data) => data[modId] ?? null,
  });
}
