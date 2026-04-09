import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components";
import { api, type AppError, type ModWadReport } from "@/lib/tauri";
import { hasErrorCode } from "@/utils/errors";
import { unwrapForQuery } from "@/utils/query";

import { libraryKeys } from "./keys";

/**
 * Force a fresh WAD footprint analysis for a single mod without running the
 * full patcher. The result is written into the WAD-report cache and the
 * matching query is updated in place.
 */
export function useAnalyzeModWads() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<ModWadReport, AppError, string>({
    mutationFn: async (modId) => {
      const result = await api.analyzeModWads(modId);
      return unwrapForQuery(result);
    },
    onSuccess: (report) => {
      // Patch the shared batch cache so the badge updates immediately.
      queryClient.setQueryData<Record<string, ModWadReport>>(libraryKeys.wadReports(), (old) =>
        old ? { ...old, [report.modId]: report } : { [report.modId]: report },
      );
      toast.success(`Analyzed: affects ${report.wadCount} WAD${report.wadCount === 1 ? "" : "s"}`);
    },
    onError: (error) => {
      if (hasErrorCode(error, "LEAGUE_NOT_FOUND")) {
        toast.error("League installation not configured");
        return;
      }
      if (hasErrorCode(error, "MOD_NOT_FOUND")) {
        toast.error("Mod no longer exists in the library");
        return;
      }
      toast.error(error.message ?? "Failed to analyze mod");
    },
  });
}
