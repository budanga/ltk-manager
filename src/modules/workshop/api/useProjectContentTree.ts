import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";

import { api, type AppError, type ContentTree } from "@/lib/tauri";
import { queryFnWithArgs } from "@/utils/query";

import { workshopKeys } from "./keys";

export function projectContentTreeOptions(projectPath: string | undefined) {
  return queryOptions<ContentTree, AppError>({
    queryKey: workshopKeys.contentTree(projectPath ?? ""),
    queryFn: projectPath ? queryFnWithArgs(api.getProjectContentTree, projectPath) : skipToken,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

/**
 * Hook to fetch a project's content directory as a per-layer file listing.
 * Refetches automatically on window focus so external edits to the content
 * directory surface without a manual refresh.
 */
export function useProjectContentTree(projectPath: string | undefined) {
  return useQuery(projectContentTreeOptions(projectPath));
}
