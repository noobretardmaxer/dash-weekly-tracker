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
    .default("true")
    .transform((v) => v === "true"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  SCHEDULER_DRIVER: z.enum(["bullmq", "trigger"]).default("bullmq"),

  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_PROJECT_ID: z.string().optional(),
  POSTHOG_HOST: z.string().default("https://us.posthog.com"),
  POSTHOG_MOCK_MODE: boolFromEnv,

  GSC_SITE_URL: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: z.string().optional(),
  GSC_MOCK_MODE: boolFromEnv,

  AHREFS_API_TOKEN: z.string().optional(),
  AHREFS_TARGET: z.string().default("hydradb.com"),
  AHREFS_MOCK_MODE: boolFromEnv,

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

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }
  return parsed.data;
}

export const env = loadEnv();
