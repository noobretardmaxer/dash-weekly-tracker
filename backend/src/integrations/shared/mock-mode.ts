import { env } from "../../lib/env";
import { logger } from "../../lib/logger";

export type IntegrationKey = "posthog" | "gsc" | "semrush" | "twitter" | "discord" | "reddit" | "blog" | "social";

const PER_INTEGRATION_OVERRIDE: Record<IntegrationKey, boolean | undefined> = {
  posthog: env.POSTHOG_MOCK_MODE,
  gsc: env.GSC_MOCK_MODE,
  semrush: env.SEMRUSH_MOCK_MODE,
  twitter: env.TWITTER_MOCK_MODE,
  discord: env.DISCORD_MOCK_MODE,
  reddit: env.REDDIT_MOCK_MODE,
  blog: env.MOCK_MODE ? true : false,
  social: env.MOCK_MODE ? true : false,
};

const HAS_CREDENTIALS: Record<IntegrationKey, () => boolean> = {
  posthog: () => Boolean(env.POSTHOG_API_KEY && env.POSTHOG_PROJECT_ID),
  gsc: () =>
    Boolean(
      (env.GOOGLE_SERVICE_ACCOUNT_B64 || (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)) &&
        env.GSC_SITE_URL
    ),
  semrush: () => Boolean(env.SEMRUSH_API_KEY),
  twitter: () => Boolean(env.TWITTER_BEARER_TOKEN),
  discord: () => Boolean(env.DISCORD_BOT_TOKEN && env.DISCORD_GUILD_ID),
  reddit: () => Boolean(env.REDDIT_CLIENT_ID && env.REDDIT_CLIENT_SECRET && env.REDDIT_USERNAME && env.REDDIT_PASSWORD),
  blog: () => true,
  social: () => true,
};

/**
 * Resolution order: explicit per-integration env override > missing
 * credentials (always falls back to mock, even if MOCK_MODE=false, so a
 * misconfigured deploy degrades gracefully instead of crashing) > global
 * MOCK_MODE.
 */
export function isMockMode(integration: IntegrationKey): boolean {
  const override = PER_INTEGRATION_OVERRIDE[integration];
  if (override !== undefined) return override;

  if (!HAS_CREDENTIALS[integration]()) {
    logger.warn(
      { integration },
      "Required credentials missing; integration will be skipped"
    );
    return false;
  }

  return env.MOCK_MODE;
}
