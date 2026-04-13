import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/tauri";
import { queryFn } from "@/utils/query";

export function usePlatformSupport() {
  return useQuery({
    queryKey: ["platform-support"],
    queryFn: queryFn(api.getPlatformSupport),
    staleTime: Infinity,
  });
}
