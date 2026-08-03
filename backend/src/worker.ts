import { createScheduler } from "./scheduler";
import { registerJobs } from "./scheduler/jobs";
import { logger } from "./lib/logger";
import { env } from "./lib/env";

async function main(): Promise<void> {
  const scheduler = createScheduler();
  registerJobs(scheduler);
  await scheduler.start();
  logger.info({ driver: env.SCHEDULER_DRIVER, mockMode: env.MOCK_MODE }, "worker started, jobs scheduled");

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
