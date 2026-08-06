"use client";

import { formatDistanceToNow } from "date-fns";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { useSyncStatus } from "@/lib/hooks/queries/use-sync-status";

/**
 * Real sync-health indicator. Reads GET /admin/sync/status and shows the true
 * most-recent successful sync time, or a warning when any integration's latest
 * sync failed. Renders nothing while loading or when the status is unavailable
 * (e.g. a non-admin's 403) — never a fabricated "synced recently" value.
 */
export function HeaderLastSync() {
  const { data } = useSyncStatus();
  if (!data) return null;

  const failures = data.latestSyncPerIntegration.filter((s) => s.status !== "success");

  if (failures.length > 0) {
    const names = failures.map((f) => f.integration).join(", ");
    return (
      <div
        className="hidden items-center gap-1.5 text-xs text-danger xl:flex"
        title={`Sync ${failures.length === 1 ? "issue" : "issues"}: ${names}`}
      >
        <AlertTriangle className="size-3.5" />
        <span>
          {failures.length} sync {failures.length === 1 ? "issue" : "issues"}
        </span>
      </div>
    );
  }

  const successTimes = data.latestSyncPerIntegration
    .filter((s) => s.status === "success" && s.finishedAt)
    .map((s) => new Date(s.finishedAt as string).getTime());
  if (successTimes.length === 0) return null;

  const lastSuccess = new Date(Math.max(...successTimes));

  return (
    <div className="hidden items-center gap-1.5 text-xs text-muted-foreground xl:flex">
      <RefreshCw className="size-3.5" />
      <span>Synced {formatDistanceToNow(lastSuccess, { addSuffix: true })}</span>
    </div>
  );
}
