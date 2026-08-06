import { Router } from "express";
import { prisma } from "../../db/prisma-client";
import { logger } from "../../lib/logger";
import { ValidationError, NotFoundError } from "../../lib/errors";
import { sendData } from "../utils/api-response";
import { INTEGRATION_JOBS, runIntegrationJobOnce, runAllIntegrationsOnce } from "../../scheduler/jobs";

export const adminRouter = Router();

function parseDays(raw: unknown): number | undefined {
  if (raw === undefined) return undefined;
  const days = Number(raw);
  if (!Number.isInteger(days) || days <= 0 || days > 365) {
    throw new ValidationError("`days` must be an integer between 1 and 365");
  }
  return days;
}

// Kick off a full backfill of every integration in the background and return
// immediately (a synchronous run of all integrations would exceed request timeouts).
adminRouter.post("/sync", (req, res) => {
  const requestId = req.requestId;
  logger.info({ requestId }, "manual full sync triggered via admin endpoint");
  runAllIntegrationsOnce({ backfill: true })
    .then((results) => logger.info({ requestId, results }, "manual full sync finished"))
    .catch((err) => logger.error({ requestId, err }, "manual full sync failed"));

  res.status(202);
  sendData(res, {
    status: "started",
    integrations: INTEGRATION_JOBS.map((s) => s.key),
    message: "Backfill running in the background. Poll GET /admin/sync/status for per-integration results.",
  });
});

// Run a single integration synchronously and return its result (or the error
// message), so a misconfigured credential surfaces directly in the response.
adminRouter.post("/sync/:integration", async (req, res, next) => {
  try {
    const spec = INTEGRATION_JOBS.find((s) => s.key === req.params.integration);
    if (!spec) {
      throw new NotFoundError(
        `Unknown integration "${req.params.integration}". Valid values: ${INTEGRATION_JOBS.map((s) => s.key).join(", ")}`
      );
    }
    const days = parseDays(req.query.days);
    const { count } = await runIntegrationJobOnce(spec, { backfill: days === undefined, days, requestId: req.requestId });
    sendData(res, { integration: spec.key, recordsProcessed: count });
  } catch (error) {
    next(error);
  }
});

// Diagnostic view: the last run status of every job plus the most recent
// sync_logs row per integration, so failures (and why) are visible.
adminRouter.get("/sync/status", async (_req, res, next) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { name: "asc" },
      select: { name: true, cronExpr: true, lastRunAt: true, lastStatus: true, lastError: true, lastDurationMs: true },
    });

    const recentLogs = await prisma.syncLog.findMany({ orderBy: { startedAt: "desc" }, take: 100 });
    const latestByIntegration = new Map<string, (typeof recentLogs)[number]>();
    for (const log of recentLogs) {
      if (!latestByIntegration.has(log.integration)) latestByIntegration.set(log.integration, log);
    }

    sendData(res, {
      jobs,
      latestSyncPerIntegration: Array.from(latestByIntegration.values()).map((log) => ({
        integration: log.integration,
        status: log.status,
        recordsProcessed: log.recordsProcessed,
        errorMessage: log.errorMessage,
        startedAt: log.startedAt,
        finishedAt: log.finishedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});
