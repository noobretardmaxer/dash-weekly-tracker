import { IntegrationFetchError } from "../../lib/errors";
import { pacificDateString } from "../../lib/date/pacific";
import type { DateRange, IntegrationModule } from "../shared/types";
import { getAccessToken } from "./auth";
import { GscError } from "./errors";
import { runSync, type SyncPropertyResult, type SyncSummary } from "./sync";

/**
 * Adapts the property-scoped GSC pipeline (auth → runSync → many tables) to the
 * generic IntegrationModule contract, so the scheduler, startup sync, admin
 * "sync now", and /admin/sync/status treat GSC like every other integration.
 * The real multi-table writes happen inside runSync; `store` just reports the
 * row count. Mock mode is intentionally unsupported (no fabricated GSC data).
 *
 * The scheduled/startup window is the trailing incremental one — the one-time
 * 16-month history load is the separate, deliberate `npm run gsc:backfill`.
 */
export function createGscIntegration(): IntegrationModule<SyncSummary, SyncPropertyResult> {
  return {
    name: "gsc",
    authenticate: async () => {
      try {
        await getAccessToken();
      } catch (error) {
        throw new IntegrationFetchError("gsc", error instanceof GscError ? error.message : (error as Error).message);
      }
    },
    fetch: async (range: DateRange) => {
      const summary = await runSync({
        startYmd: pacificDateString(range.from),
        endYmd: pacificDateString(range.to),
        dataState: "all",
        jobType: "daily",
        windowDays: 400,
      });
      if (summary.results.length === 0) {
        throw new IntegrationFetchError(
          "gsc",
          "No accessible Search Console properties — add the service-account email to the property (run gsc:doctor)."
        );
      }
      const failed = summary.results.filter((r) => r.status === "failed");
      if (failed.length === summary.results.length) {
        throw new IntegrationFetchError("gsc", failed[0]?.error ?? "All property syncs failed");
      }
      return summary;
    },
    normalize: async (summary) => summary.results,
    store: async (results) => ({ count: results.reduce((sum, r) => sum + r.rowsWritten, 0) }),
  };
}
