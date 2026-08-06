"use client";

import { formatDistanceToNow } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { useSyncStatus } from "@/lib/hooks/queries/use-sync-status";

/**
 * Per-panel banner shown when the panel's integration's latest sync failed, so a
 * blank/stale panel reads as "Search Console sync failed 3h ago: <error>" rather
 * than a silently empty chart. Renders nothing on success, while loading, or when
 * the status is unavailable (non-admins get no banner — the empty state stands).
 */
export function SyncStatusBanner({ integration, label }: { integration: string; label?: string }) {
  const { data } = useSyncStatus();
  if (!data) return null;

  const entry = data.latestSyncPerIntegration.find((s) => s.integration === integration);
  if (!entry || entry.status === "success") return null;

  const when = entry.startedAt ? formatDistanceToNow(new Date(entry.startedAt), { addSuffix: true }) : "recently";
  const verb = entry.status === "partial" ? "degraded" : "failed";

  return (
    <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-0.5">
        <p className="font-medium">
          {label ?? integration} sync {verb} {when}.
        </p>
        {entry.errorMessage ? <p className="text-danger/80">{entry.errorMessage}</p> : null}
        <p className="text-muted-foreground">Data shown may be stale or missing until the next successful sync.</p>
      </div>
    </div>
  );
}
