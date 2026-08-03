import { prisma } from "../db/prisma-client";
import { runIntegration } from "../integrations/shared/run-integration";
import { createPostHogIntegration } from "../integrations/posthog";
import { createGscIntegration } from "../integrations/gsc";
import { createAhrefsIntegration } from "../integrations/ahrefs";
import { createTwitterIntegration } from "../integrations/twitter";
import { createDiscordIntegration } from "../integrations/discord";
import { createRedditIntegration } from "../integrations/reddit";
import { generateExecutiveReport } from "../services/reports/generate-executive-report";
import type { IntegrationModule } from "../integrations/shared/types";
import type { SchedulerPort, JobHandlerContext } from "./types";

const HOURLY_CRON = "0 * * * *";
const DAILY_CRON = "0 3 * * *";
const WEEKLY_MONDAY_CRON = "0 6 * * 1";

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

function registerIntegrationJob(
  scheduler: SchedulerPort,
  name: string,
  cronExpr: string,
  createModule: () => IntegrationModule<unknown, unknown>,
  rangeDays: number
): void {
  scheduler.registerJob(name, cronExpr, async (ctx: JobHandlerContext) => {
    const jobId = await ensureJobRecord(name, cronExpr);
    const integration = createModule();
    await runIntegration(integration, rangeEndingNow(rangeDays), { jobId, requestId: ctx.requestId });
  });
}

/**
 * Single registration point for every scheduled sync. Adding a new
 * integration means creating its module (see integrations/<name>/) and one
 * line here — nothing else in the system needs to change.
 */
export function registerJobs(scheduler: SchedulerPort): void {
  registerIntegrationJob(scheduler, "posthog-sync", HOURLY_CRON, createPostHogIntegration, 2);
  registerIntegrationJob(scheduler, "twitter-sync", HOURLY_CRON, createTwitterIntegration, 2);
  registerIntegrationJob(scheduler, "discord-sync", HOURLY_CRON, createDiscordIntegration, 2);
  registerIntegrationJob(scheduler, "reddit-sync", HOURLY_CRON, createRedditIntegration, 2);

  registerIntegrationJob(scheduler, "gsc-sync", DAILY_CRON, createGscIntegration, 7);
  // One Ahrefs sync covers the spec's "Ahrefs" + "Keyword Rankings" daily jobs in a single
  // run, since the Ahrefs integration writes seo_metrics, keyword_rankings, and
  // competitor_metrics together (see integrations/ahrefs/store.ts).
  registerIntegrationJob(scheduler, "ahrefs-sync", DAILY_CRON, createAhrefsIntegration, 1);

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
