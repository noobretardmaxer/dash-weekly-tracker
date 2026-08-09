"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSyncStatus } from "@/lib/hooks/queries/use-sync-status";
import { triggerIntegrationSync, type SyncStatusValue } from "@/lib/api/admin";

const INTEGRATION_LABELS: Record<string, string> = {
  posthog: "Website",
  gsc: "Search Console",
  semrush: "SEO",
  twitter: "Twitter / X",
  discord: "Discord",
  reddit: "Reddit",
  blog: "Content",
  social: "Social",
};

const labelFor = (key: string) => INTEGRATION_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);

function StatusDot({ status }: { status: SyncStatusValue }) {
  const color = status === "success" ? "bg-success" : status === "partial" ? "bg-warning" : "bg-danger";
  return <span className={cn("size-2 shrink-0 rounded-full", color)} />;
}

/**
 * Real sync-health indicator + control. Reads GET /admin/sync/status and opens a
 * dropdown listing every integration's status, last sync time and error (a
 * classified reason, not a raw stack), with a per-integration "Sync now". Never a
 * fabricated "synced recently" value — renders nothing when status is unavailable.
 */
export function HeaderLastSync() {
  const { data } = useSyncStatus();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (integration: string) => triggerIntegrationSync(integration),
    onMutate: (integration) => setSyncing(integration),
    onSettled: () => {
      setSyncing(null);
      queryClient.invalidateQueries({ queryKey: ["sync-status"] });
      queryClient.invalidateQueries({ queryKey: ["gsc"] });
    },
  });

  if (!data) return null;

  const entries = [...data.latestSyncPerIntegration].sort((a, b) =>
    labelFor(a.integration).localeCompare(labelFor(b.integration))
  );
  const failures = entries.filter((s) => s.status !== "success");

  const successTimes = entries
    .filter((s) => s.status === "success" && s.finishedAt)
    .map((s) => new Date(s.finishedAt as string).getTime());
  const lastSuccess = successTimes.length ? new Date(Math.max(...successTimes)) : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "hidden items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors hover:bg-accent xl:flex",
            failures.length > 0 ? "text-danger" : "text-muted-foreground"
          )}
        >
          {failures.length > 0 ? (
            <>
              <AlertTriangle className="size-3.5" />
              <span>
                {failures.length} sync {failures.length === 1 ? "issue" : "issues"}
              </span>
            </>
          ) : lastSuccess ? (
            <>
              <RefreshCw className="size-3.5" />
              <span>Synced {formatDistanceToNow(lastSuccess, { addSuffix: true })}</span>
            </>
          ) : (
            <>
              <Clock className="size-3.5" />
              <span>Sync status</span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-3 py-2 text-xs font-medium">Integration sync status</div>
        <ul className="max-h-96 divide-y divide-border overflow-auto">
          {entries.map((entry) => {
            const isSyncing = syncing === entry.integration;
            return (
              <li key={entry.integration} className="flex items-start gap-2 px-3 py-2.5">
                <div className="mt-1">
                  <StatusDot status={entry.status} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{labelFor(entry.integration)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 gap-1 px-1.5 text-[11px]"
                      disabled={isSyncing || mutation.isPending}
                      onClick={() => mutation.mutate(entry.integration)}
                    >
                      <RefreshCw className={cn("size-3", isSyncing && "animate-spin")} />
                      {isSyncing ? "Syncing…" : "Sync now"}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {entry.status === "success" ? (
                      entry.finishedAt ? (
                        <>
                          <CheckCircle2 className="mr-1 inline size-3 text-success" />
                          Synced {formatDistanceToNow(new Date(entry.finishedAt), { addSuffix: true })}
                          {entry.recordsProcessed != null ? ` · ${entry.recordsProcessed} rows` : ""}
                        </>
                      ) : (
                        "Synced"
                      )
                    ) : (
                      <span className="text-danger">{entry.errorMessage ?? `Sync ${entry.status}`}</span>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
