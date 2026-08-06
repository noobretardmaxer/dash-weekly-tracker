import { prisma } from "../db/prisma-client";
import { runIntegration } from "../integrations/shared/run-integration";
import { createPostHogIntegration } from "../integrations/posthog";
import { createGscIntegration } from "../integrations/gsc";
import { createAhrefsIntegration } from "../integrations/ahrefs";
import { createTwitterIntegration } from "../integrations/twitter";
import { createDiscordIntegration } from "../integrations/discord";
import { createRedditIntegration } from "../integrations/reddit";
import { createBlogIntegration } from "../integrations/blog";
import { createSocialIntegration } from "../integrations/social";
import { generateExecutiveReport } from "../services/reports/generate-executive-report";
import type { IntegrationModule } from "../integrations/shared/types";
import type { IntegrationKey } from "../integrations/shared/mock-mode";
import type { SchedulerPort, JobHandlerContext } from "./types";

const HOURLY_CRON = "0 * * * *";
const DAILY_CRON = "0 3 * * *";
const WEEKLY_MONDAY_CRON = "0 6 * * 1";

/**
 * One entry per scheduled integration sync. This is the single source of truth
 * shared by the cron scheduler (registerJobs), the startup backfill, and the
 * manual "sync now" admin endpoint.
 *
 * - `rangeDays`    — the incremental window each cron tick pulls.
 * - `backfillDays` — the larger historical window used on startup / manual full
 *   sync. Twitter/Discord/Ahrefs only ever return a current-day snapshot from
 *   their real APIs, so a larger window gains nothing there and matches rangeDays.
 */
export type IntegrationJobSpec = {
  key: IntegrationKey;
  name: string;
  cronExpr: string;
  createModule: () => IntegrationModule<unknown, unknown>;
  rangeDays: number;
  backfillDays: number;
};

export const INTEGRATION_JOBS: IntegrationJobSpec[] = [
  { key: "posthog", name: "posthog-sync", cronExpr: HOURLY_CRON, createModule: createPostHogIntegration, rangeDays: 2, backfillDays: 90 },
  { key: "twitter", name: "twitter-sync", cronExpr: HOURLY_CRON, createModule: createTwitterIntegration, rangeDays: 2, backfillDays: 2 },
  { key: "discord", name: "discord-sync", cronExpr: HOURLY_CRON, createModule: createDiscordIntegration, rangeDays: 2, backfillDays: 2 },
  { key: "reddit", name: "reddit-sync", cronExpr: HOURLY_CRON, createModule: createRedditIntegration, rangeDays: 2, backfillDays: 7 },
  { key: "gsc", name: "gsc-sync", cronExpr: DAILY_CRON, createModule: createGscIntegration, rangeDays: 7, backfillDays: 90 },
  // One Ahrefs sync covers the spec's "Ahrefs" + "Keyword Rankings" daily jobs in a single
  // run, since the Ahrefs integration writes seo_metrics, keyword_rankings, and
  // competitor_metrics together (see integrations/ahrefs/store.ts).
  { key: "ahrefs", name: "ahrefs-sync", cronExpr: DAILY_CRON, createModule: createAhrefsIntegration, rangeDays: 1, backfillDays: 1 },
  // Blog + Social have no real third-party source yet (fixture data); they still
  // run as first-class daily jobs so the Content and Social Leaderboard panels
  // populate in production. Larger backfill windows seed the full history.
  { key: "blog", name: "blog-sync", cronExpr: DAILY_CRON, createModule: createBlogIntegration, rangeDays: 7, backfillDays: 200 },
  { key: "social", name: "social-sync", cronExpr: DAILY_CRON, createModule: createSocialIntegration, rangeDays: 7, backfillDays: 200 },
];

async function ensureJobRecord(name: string, cronExpr: string): Promise<string> {
  const job = await prisma.job.upsert({
    where: { name },
    create: { name, cronExpr },
    update: { cronExpr },
  });
  return job.id;
}

function rangeEndingNow(days: number): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from, to };
}

/**
 * Run a single integration sync once, right now, through the same
 * runIntegration seam the scheduler uses (so sync_logs / jobs bookkeeping and
 * alert checks all happen identically). Used by the cron handler, the startup
 * backfill, and the manual admin endpoint.
 */
export async function runIntegrationJobOnce(
  spec: IntegrationJobSpec,
  opts: { backfill?: boolean; days?: number; requestId?: string } = {}
): Promise<{ count: number }> {
  const jobId = await ensureJobRecord(spec.name, spec.cronExpr);
  const integration = spec.createModule();
  const days = opts.days ?? (opts.backfill ? spec.backfillDays : spec.rangeDays);
  return runIntegration(integration, rangeEndingNow(days), { jobId, requestId: opts.requestId });
}

export type IntegrationRunResult = { name: string; key: IntegrationKey; count: number; error?: string };

/**
 * Run every integration sync once, sequentially. runIntegration already swallows
 * expected fetch/circuit errors (writing a sync_logs failure row and returning
 * count:0), so the try/catch here only guards genuinely unexpected errors and
 * keeps one failing integration from aborting the rest.
 */
export async function runAllIntegrationsOnce(opts: { backfill?: boolean } = {}): Promise<IntegrationRunResult[]> {
  const results: IntegrationRunResult[] = [];
  for (const spec of INTEGRATION_JOBS) {
    try {
      const { count } = await runIntegrationJobOnce(spec, { backfill: opts.backfill });
      results.push({ name: spec.name, key: spec.key, count });
    } catch (error) {
      results.push({ name: spec.name, key: spec.key, count: 0, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return results;
}

/**
 * Single registration point for every scheduled sync. Adding a new integration
 * means creating its module (see integrations/<name>/) and one entry in
 * INTEGRATION_JOBS above — nothing else in the system needs to change.
 */
export function registerJobs(scheduler: SchedulerPort): void {
  for (const spec of INTEGRATION_JOBS) {
    scheduler.registerJob(spec.name, spec.cronExpr, async (ctx: JobHandlerContext) => {
      await runIntegrationJobOnce(spec, { requestId: ctx.requestId });
    });
  }

  scheduler.registerJob("executive-report", WEEKLY_MONDAY_CRON, async (ctx) => {
    const jobId = await ensureJobRecord("executive-report", WEEKLY_MONDAY_CRON);
    const startedAt = new Date();
    try {
      await generateExecutiveReport();
      await prisma.job.update({
        where: { id: jobId },
        data: { lastRunAt: new Date(), lastStatus: "success", lastError: null, lastDurationMs: Date.now() - startedAt.getTime() },
      });
    } catch (error) {
      ctx.logger.error({ err: error }, "executive report job failed");
      await prisma.job.update({
        where: { id: jobId },
        data: {
          lastRunAt: new Date(),
          lastStatus: "failure",
          lastError: error instanceof Error ? error.message : String(error),
          lastDurationMs: Date.now() - startedAt.getTime(),
        },
      });
    }
  });
}
