import { prisma } from "../../db/prisma-client";
import { logger } from "../../lib/logger";
import { env } from "../../lib/env";
import { ALERT_RULES, DEFAULT_ALERT_THRESHOLDS, type AlertThresholds } from "./rules";

async function resolveThresholds(): Promise<AlertThresholds> {
  const setting = await prisma.setting.findUnique({ where: { key: "alerts.thresholds" } });
  if (setting?.value && typeof setting.value === "object") {
    return { ...DEFAULT_ALERT_THRESHOLDS, ...(setting.value as Partial<AlertThresholds>) };
  }
  return DEFAULT_ALERT_THRESHOLDS;
}

/**
 * Runs every alert rule, and opens a new alert for each candidate unless an
 * open alert of the same type was already created within the cooldown
 * window (avoids re-alerting on every hourly sync for the same ongoing issue).
 */
export async function runAlertChecks(): Promise<{ created: number }> {
  const thresholds = await resolveThresholds();
  const cooldownStart = new Date(Date.now() - thresholds.cooldownHours * 60 * 60 * 1000);

  const results = await Promise.all(ALERT_RULES.map((rule) => rule(thresholds).catch((err) => {
    logger.error({ err, rule: rule.name }, "alert rule failed");
    return null;
  })));

  let created = 0;
  for (const candidate of results) {
    if (!candidate) continue;

    const existing = await prisma.alert.findFirst({
      where: { type: candidate.type, status: "open", createdAt: { gte: cooldownStart } },
    });
    if (existing) continue;

    await prisma.alert.create({
      data: {
        type: candidate.type,
        severity: candidate.severity,
        title: candidate.title,
        message: candidate.message,
        metricSource: candidate.metricSource,
        currentValue: candidate.currentValue,
        previousValue: candidate.previousValue,
        deltaPct: candidate.deltaPct,
        status: "open",
      },
    });
    created += 1;
  }

  if (created > 0) logger.info({ created }, "alert checks created new alerts");
  return { created };
}

/**
 * Posts a short message to the optional outbound alert webhook (a Discord or
 * Slack incoming-webhook URL). Both `content` (Discord) and `text` (Slack) keys
 * are sent so one payload works with either. No-ops when ALERT_WEBHOOK_URL is
 * unset; failures are logged, never thrown.
 */
async function postAlertWebhook(text: string): Promise<void> {
  if (!env.ALERT_WEBHOOK_URL) return;
  try {
    await fetch(env.ALERT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, text }),
    });
  } catch (err) {
    logger.error({ err }, "failed to post alert webhook");
  }
}

/**
 * Raises a "sync_failure" alert (visible in the alerts UI + optional webhook)
 * when an integration sync fails. Deduped per-integration within the alert
 * cooldown window so an ongoing failure (retried every hour) alerts once, not
 * on every tick. Called from run-integration.ts's failure path.
 */
export async function recordSyncFailureAlert(
  integration: string,
  message: string,
  opts: { partial?: boolean } = {}
): Promise<void> {
  const metricSource = `sync:${integration}`;
  const thresholds = await resolveThresholds();
  const cooldownStart = new Date(Date.now() - thresholds.cooldownHours * 60 * 60 * 1000);

  const existing = await prisma.alert.findFirst({
    where: { type: "sync_failure", metricSource, status: "open", createdAt: { gte: cooldownStart } },
  });
  if (existing) return;

  const truncated = message.length > 500 ? `${message.slice(0, 500)}…` : message;

  await prisma.alert.create({
    data: {
      type: "sync_failure",
      severity: opts.partial ? "warning" : "critical",
      title: `${integration} sync ${opts.partial ? "degraded" : "failed"}`,
      message: truncated,
      metricSource,
      currentValue: 0,
      previousValue: 0,
      deltaPct: 0,
      status: "open",
    },
  });

  await postAlertWebhook(`🚨 ${integration} sync ${opts.partial ? "degraded" : "failed"}: ${truncated}`);
}
