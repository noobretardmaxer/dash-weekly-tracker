import { prisma } from "../../db/prisma-client";
import { logger } from "../../lib/logger";
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
