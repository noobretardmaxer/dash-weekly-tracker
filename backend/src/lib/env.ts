import { z } from "zod";

const boolFromEnv = z
  .enum(["true", "false", ""])
  .optional()
  .transform((v) => (v === "true" ? true : v === "false" ? false : undefined));

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MOCK_MODE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  SCHEDULER_DRIVER: z.enum(["bullmq", "trigger"]).default("bullmq"),

  // When true, the worker runs a one-off historical backfill of every integration
  // on startup (BullMQ cron jobs otherwise only fire at the next tick, so a fresh
  // deploy shows no data until then). Set false once history exists to avoid
  // re-backfilling on every restart.
  BACKFILL_ON_STARTUP: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),

  // Optional outbound webhook (Discord/Slack incoming-webhook URL) that receives
  // a message whenever an integration sync fails. Unset (or empty) disables it.
  ALERT_WEBHOOK_URL: z.union([z.string().url(), z.literal("")]).optional(),

  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_PROJECT_ID: z.string().optional(),
  POSTHOG_HOST: z.string().default("https://us.posthog.com"),
  POSTHOG_MOCK_MODE: boolFromEnv,

  GSC_SITE_URL: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: z.string().optional(),
  GSC_MOCK_MODE: boolFromEnv,

  // SEO is real-data-only — there is no Semrush mock client, so no SEMRUSH_MOCK_MODE.
  SEMRUSH_API_KEY: z.string().optional(),
  SEMRUSH_TARGET: z.string().default("hydradb.com"),
  SEMRUSH_DATABASE: z.string().default("us"),

  TWITTER_BEARER_TOKEN: z.string().optional(),
  TWITTER_USERNAME: z.string().default("hydradb"),
  TWITTER_MOCK_MODE: boolFromEnv,

  DISCORD_BOT_TOKEN: z.string().optional(),
  DISCORD_GUILD_ID: z.string().optional(),
  DISCORD_MOCK_MODE: boolFromEnv,

  REDDIT_CLIENT_ID: z.string().optional(),
  REDDIT_CLIENT_SECRET: z.string().optional(),
  REDDIT_USERNAME: z.string().optional(),
  REDDIT_PASSWORD: z.string().optional(),
  REDDIT_USER_AGENT: z.string().default("hydradb-growth-dashboard/0.1"),
  REDDIT_MOCK_MODE: boolFromEnv,

  TRIGGER_API_KEY: z.string().optional(),
  TRIGGER_API_URL: z.string().default("https://api.trigger.dev"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Fail-fast / warn-loud checks for misconfigurations that otherwise surface only
 * as a mysterious blank dashboard (worker can't connect to Redis → never syncs).
 * Uses console (not the logger) to avoid an import cycle, and runs once at import.
 */
function validateRuntimeConfig(data: Env): void {
  // Upstash and most managed Redis require TLS; ioredis only enables TLS on the
  // `rediss://` scheme. A plain `redis://` URL silently fails to connect, which
  // stops BullMQ — so the worker never runs and nothing is ever synced.
  if (!/^rediss:\/\//i.test(data.REDIS_URL)) {
    if (/upstash\.io/i.test(data.REDIS_URL) || data.NODE_ENV === "production") {
      // eslint-disable-next-line no-console
      console.warn(
        "[config] REDIS_URL is not a rediss:// (TLS) URL. Upstash/managed Redis " +
          "require TLS — BullMQ will fail to connect and the worker will not run. " +
          "Set REDIS_URL to a rediss:// URL."
      );
    }
  }

  // eslint-disable-next-line no-console
  console.info(
    `[config] loaded: NODE_ENV=${data.NODE_ENV} MOCK_MODE=${data.MOCK_MODE} ` +
      `BACKFILL_ON_STARTUP=${data.BACKFILL_ON_STARTUP} SCHEDULER_DRIVER=${data.SCHEDULER_DRIVER}`
  );
}

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }
  validateRuntimeConfig(parsed.data);
  return parsed.data;
}

export const env = loadEnv();
