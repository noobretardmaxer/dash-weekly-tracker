import { env } from "../lib/env";
import { createBullMqScheduler } from "./bullmq-adapter";
import { createTriggerScheduler } from "./trigger-adapter";
import type { SchedulerPort } from "./types";

export type { SchedulerPort, JobHandler, JobHandlerContext, RegisterJobOptions } from "./types";

/** The only place that branches on which scheduler driver is active. */
export function createScheduler(): SchedulerPort {
  return env.SCHEDULER_DRIVER === "trigger" ? createTriggerScheduler() : createBullMqScheduler();
}
