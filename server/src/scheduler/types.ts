import type { Logger } from "../lib/logger";

export type JobHandlerContext = { requestId: string; logger: Logger };
export type JobHandler = (ctx: JobHandlerContext) => Promise<void>;

export type RegisterJobOptions = {
  timeoutMs?: number;
  retry?: { attempts: number; backoffMs: number };
};

/**
 * A single interface both the BullMQ (default, self-hosted) and Trigger.dev
 * adapters implement, so nothing else in the codebase branches on which
 * scheduler is active.
 */
export interface SchedulerPort {
  registerJob(name: string, cronExpr: string, handler: JobHandler, options?: RegisterJobOptions): void;
  start(): Promise<void>;
  stop(): Promise<void>;
  triggerNow(name: string): Promise<void>;
}
