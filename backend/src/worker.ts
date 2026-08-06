import { createScheduler } from "./scheduler";
import { registerJobs, runAllIntegrationsOnce } from "./scheduler/jobs";
import { logger } from "./lib/logger";
import { env } from "./lib/env";

async function main(): Promise<void> {
  const scheduler = createScheduler();
  registerJobs(scheduler);
  await scheduler.start();
  logger.info({ driver: env.SCHEDULER_DRIVER, mockMode: env.MOCK_MODE }, "worker started, jobs scheduled");

  if (env.BACKFILL_ON_STARTUP) {
    // Fire-and-forget so a slow/failing external API can't block the scheduler.
    // store() is an idempotent upsert, so re-running on every restart is safe.
    logger.info("running startup backfill for all integrations");
    runAllIntegrationsOnce({ backfill: true })
      .then((results) => logger.info({ results }, "startup backfill finished"))
      .catch((err) => logger.error({ err }, "startup backfill failed"));
  }

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "worker shutting down");
    await scheduler.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error) => {
  logger.error({ err: error }, "worker failed to start");
  process.exit(1);
});
