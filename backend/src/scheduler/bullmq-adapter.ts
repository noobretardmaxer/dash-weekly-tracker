import { randomUUID } from "crypto";
import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { env } from "../lib/env";
import { logger } from "../lib/logger";
import type { JobHandler, RegisterJobOptions, SchedulerPort } from "./types";

type Registration = { handler: JobHandler; cronExpr: string; options?: RegisterJobOptions };

export function createBullMqScheduler(): SchedulerPort {
  const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  const queue = new Queue("hydradb-scheduled-jobs", { connection });
  const registrations = new Map<string, Registration>();
  let worker: Worker | undefined;

  function registerJob(name: string, cronExpr: string, handler: JobHandler, options?: RegisterJobOptions): void {
    registrations.set(name, { handler, cronExpr, options });
  }

  async function start(): Promise<void> {
    for (const [name, { cronExpr, options }] of registrations.entries()) {
      await queue.add(name, {}, {
        repeat: { pattern: cronExpr },
        jobId: name,
        attempts: options?.retry?.attempts ?? 3,
        backoff: { type: "exponential", delay: options?.retry?.backoffMs ?? 5_000 },
      });
    }

    worker = new Worker(
      "hydradb-scheduled-jobs",
      async (job: Job) => {
        const registration = registrations.get(job.name);
        if (!registration) {
          logger.warn({ job: job.name }, "no handler registered for scheduled job");
          return;
        }
        const requestId = randomUUID();
        await registration.handler({ requestId, logger: logger.child({ job: job.name, requestId }) });
      },
      { connection, concurrency: 4 }
    );

    worker.on("failed", (job, err) => logger.error({ job: job?.name, err }, "scheduled job failed"));
  }

  async function stop(): Promise<void> {
    await worker?.close();
    await queue.close();
    connection.disconnect();
  }

  async function triggerNow(name: string): Promise<void> {
    const registration = registrations.get(name);
    if (!registration) throw new Error(`No job registered with name "${name}"`);
    const requestId = randomUUID();
    await registration.handler({ requestId, logger: logger.child({ job: name, requestId, manual: true }) });
  }

  return { registerJob, start, stop, triggerNow };
}
