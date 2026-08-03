import { randomUUID } from "crypto";
import { schedules, tasks, configure } from "@trigger.dev/sdk/v3";
import { env } from "../lib/env";
import { logger } from "../lib/logger";
import type { JobHandler, RegisterJobOptions, SchedulerPort } from "./types";

/**
 * Trigger.dev adapter (https://trigger.dev/docs/v3). Unlike BullMQ, Trigger.dev
 * tasks are registered at build time and deployed/run via the `trigger.dev`
 * CLI (`npx trigger.dev@latest dev` / `deploy`), not started in-process — so
 * `start()` here only confirms configuration and defines the task objects;
 * the actual cron scheduling takes effect once this project is deployed to
 * Trigger.dev. Selected via SCHEDULER_DRIVER=trigger + TRIGGER_API_KEY.
 */
export function createTriggerScheduler(): SchedulerPort {
  const registrations = new Map<string, { handler: JobHandler; cronExpr: string; options?: RegisterJobOptions }>();
  const definedTasks = new Map<string, ReturnType<typeof schedules.task>>();

  function registerJob(name: string, cronExpr: string, handler: JobHandler, options?: RegisterJobOptions): void {
    registrations.set(name, { handler, cronExpr, options });
  }

  async function start(): Promise<void> {
    if (!env.TRIGGER_API_KEY) {
      throw new Error("SCHEDULER_DRIVER=trigger requires TRIGGER_API_KEY to be set");
    }
    configure({ secretKey: env.TRIGGER_API_KEY, baseURL: env.TRIGGER_API_URL });

    for (const [name, { cronExpr, handler, options }] of registrations.entries()) {
      const task = schedules.task({
        id: name,
        cron: cronExpr,
        maxDuration: (options?.timeoutMs ?? 300_000) / 1000,
        run: async () => {
          const requestId = randomUUID();
          await handler({ requestId, logger: logger.child({ job: name, requestId }) });
        },
      });
      definedTasks.set(name, task);
    }

    logger.info({ jobs: Array.from(registrations.keys()) }, "Trigger.dev tasks defined (deploy via `npx trigger.dev@latest deploy` to activate cron schedules)");
  }

  async function stop(): Promise<void> {
    // Trigger.dev tasks run on Trigger.dev's infrastructure once deployed; nothing to tear down locally.
  }

  async function triggerNow(name: string): Promise<void> {
    if (!definedTasks.has(name)) throw new Error(`No job registered with name "${name}"`);
    await tasks.trigger(name, {});
  }

  return { registerJob, start, stop, triggerNow };
}
