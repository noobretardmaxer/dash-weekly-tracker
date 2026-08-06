import { useQuery } from "@tanstack/react-query";
import { getSyncStatus } from "@/lib/api/admin";

/**
 * Real per-integration sync health from GET /api/v1/admin/sync/status.
 * `retry: false` because the endpoint is admin-only — a non-admin's 403 should
 * fail quietly (consumers render nothing when there's no data), not retry.
 */
export function useSyncStatus() {
  return useQuery({
    queryKey: ["sync-status"],
    queryFn: getSyncStatus,
    retry: false,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}
