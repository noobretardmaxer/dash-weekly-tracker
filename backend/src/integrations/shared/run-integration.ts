import { randomUUID } from "crypto";
import { prisma } from "../../db/prisma-client";
import { logger } from "../../lib/logger";
import { CircuitOpenError, IntegrationFetchError, IntegrationNotConfiguredError } from "../../lib/errors";
import { withRetry } from "../../lib/retry";
import { getCircuitBreaker } from "./circuit-breaker";
import type { DateRange, IntegrationModule } from "./types";
import type { IntegrationName as PrismaIntegrationName } from "@prisma/client";
import { runAlertChecks, recordSyncFailureAlert } from "../../services/alerts/engine";

export type RunIntegrationOptions = {
  jobId?: string;
  requestId?: string;
};

/**
 * Single orchestration seam every scheduled sync goes through:
 * authenticate -> fetch (circuit-breaker + retry wrapped) -> normalize -> store,
 * with a sync_logs row and jobs bookkeeping around the whole run, and alert
 * checks re-run immediately after so alerts are always fresh right after new
 * data lands.
 */
export async function runIntegration<TRaw, TNormalized>(
  module: IntegrationModule<TRaw, TNormalized>,
  range: DateRange,
  options: RunIntegrationOptions = {}
): Promise<{ count: number }> {
  const requestId = options.requestId ?? randomUUID();
  const startedAt = new Date();
  const log = logger.child({ integration: module.name, requestId, jobId: options.jobId });

  log.info({ range }, "sync started");

  try {
    await module.authenticate();

    const guardedFetch = getCircuitBreaker(module.name, () => withRetry(() => module.fetch(range)));
    const raw = await guardedFetch();

    const normalized = await module.normalize(raw);
    const result = await module.store(normalized);

    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();

    await prisma.syncLog.create({
      data: {
        jobId: options.jobId,
        integration: module.name as PrismaIntegrationName,
        requestId,
        startedAt,
        finishedAt,
        durationMs,
        status: "success",
        recordsProcessed: result.count,
      },
    });

    if (options.jobId) {
      await prisma.job.update({
        where: { id: options.jobId },
        data: { lastRunAt: finishedAt, lastDurationMs: durationMs, lastStatus: "success", lastError: null },
      });
    }

    log.info({ durationMs, count: result.count }, "sync finished");

    runAlertChecks().catch((err) => log.error({ err }, "alert checks failed after sync"));

    return result;
  } catch (error) {
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();
    const isCircuitOpen = error instanceof CircuitOpenError;
    // A not-configured integration (e.g. no API key) is a skipped run, not a
    // failure — record it as "degraded" and don't raise a sync-failure alert for
    // something that was simply never set up.
    const isNotConfigured = error instanceof IntegrationNotConfiguredError;
    const message = error instanceof Error ? error.message : String(error);

    if (isNotConfigured) {
      log.warn({ durationMs }, "sync skipped: integration not configured");
    } else {
      log.error({ err: error, durationMs }, "sync failed");
    }

    await prisma.syncLog.create({
      data: {
        jobId: options.jobId,
        integration: module.name as PrismaIntegrationName,
        requestId,
        startedAt,
        finishedAt,
        durationMs,
        status: isCircuitOpen || isNotConfigured ? "partial" : "failure",
        errorMessage: message,
      },
    });

    if (options.jobId) {
      await prisma.job.update({
        where: { id: options.jobId },
        data: { lastRunAt: finishedAt, lastDurationMs: durationMs, lastStatus: "failure", lastError: message },
      });
    }

    // Surface the failure as an alert (UI + optional webhook) so a broken sync
    // is visible instead of only living in sync_logs. Fire-and-forget. Skip for a
    // not-configured integration — that's expected until credentials are added.
    if (!isNotConfigured) {
      recordSyncFailureAlert(module.name, message, { partial: isCircuitOpen }).catch((err) =>
        log.error({ err }, "failed to record sync failure alert")
      );
    }

    if (!(error instanceof IntegrationFetchError) && !isCircuitOpen && !isNotConfigured) {
      throw error;
    }

    return { count: 0 };
  }
}
