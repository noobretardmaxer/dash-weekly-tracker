import { apiGet } from "./client";

export type SyncStatusValue = "success" | "failure" | "partial";

export type SyncJob = {
  name: string;
  cronExpr: string;
  lastRunAt: string | null;
  lastStatus: SyncStatusValue | null;
  lastError: string | null;
  lastDurationMs: number | null;
};

export type SyncLogEntry = {
  integration: string;
  status: SyncStatusValue;
  recordsProcessed: number | null;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
};

export type SyncStatusResponse = {
  jobs: SyncJob[];
  latestSyncPerIntegration: SyncLogEntry[];
};

// Admin-only endpoint — callers should treat a rejection (e.g. 403 for
// non-admins) as "status unavailable" and render nothing, not an error.
export function getSyncStatus(): Promise<SyncStatusResponse> {
  return apiGet<{ data: SyncStatusResponse }>("/admin/sync/status").then((res) => res.data);
}
