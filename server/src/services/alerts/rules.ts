import { prisma } from "../../db/prisma-client";
import { computeDeltaPct, sumSeries, type TimeSeriesPoint } from "../analytics/growth";

export type AlertCandidateType =
  | "traffic_drop"
  | "keyword_drop"
  | "backlinks_lost"
  | "activation_drop"
  | "signups_drop"
  | "mention_spike";

export type AlertCandidate = {
  type: AlertCandidateType;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  metricSource: string;
  currentValue: number;
  previousValue: number;
  deltaPct: number;
};

export type AlertThresholds = {
  trafficDropPct: number;
  activationDropPct: number;
  signupsDropPct: number;
  keywordMovementDrop: number;
  backlinksLostThreshold: number;
  mentionSpikeMultiplier: number;
  cooldownHours: number;
};

export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  trafficDropPct: -10,
  activationDropPct: -10,
  signupsDropPct: -15,
  keywordMovementDrop: -5,
  backlinksLostThreshold: 5,
  mentionSpikeMultiplier: 2,
  cooldownHours: 24,
};

async function last14DaysWebsiteMetrics() {
  return prisma.websiteMetric.findMany({ orderBy: { date: "desc" }, take: 14 });
}

function toSeries<T extends { date: Date }>(rows: T[], key: keyof T): TimeSeriesPoint[] {
  return [...rows]
    .reverse()
    .map((row) => ({ date: row.date.toISOString().slice(0, 10), value: Number(row[key]) }));
}

export async function checkTrafficDrop(thresholds: AlertThresholds): Promise<AlertCandidate | null> {
  const rows = await last14DaysWebsiteMetrics();
  if (rows.length < 14) return null;
  const series = toSeries(rows, "visitors");
  const current = sumSeries(series.slice(-7));
  const previous = sumSeries(series.slice(0, 7));
  const deltaPct = computeDeltaPct(current, previous);
  if (deltaPct > thresholds.trafficDropPct) return null;

  return {
    type: "traffic_drop",
    severity: deltaPct <= thresholds.trafficDropPct * 2 ? "critical" : "warning",
    title: "Website traffic dropped",
    message: `Website visitors fell ${Math.abs(deltaPct)}% week-over-week.`,
    metricSource: "website_metrics.visitors",
    currentValue: current,
    previousValue: previous,
    deltaPct,
  };
}

export async function checkActivationDrop(thresholds: AlertThresholds): Promise<AlertCandidate | null> {
  const rows = await last14DaysWebsiteMetrics();
  if (rows.length < 14) return null;
  const series = toSeries(rows, "activationRate");
  const current = series.slice(-7).reduce((a, p) => a + p.value, 0) / 7;
  const previous = series.slice(0, 7).reduce((a, p) => a + p.value, 0) / 7;
  const deltaPct = computeDeltaPct(current, previous);
  if (deltaPct > thresholds.activationDropPct) return null;

  return {
    type: "activation_drop",
    severity: deltaPct <= thresholds.activationDropPct * 2 ? "critical" : "warning",
    title: "Activation rate declining",
    message: `Activation rate fell ${Math.abs(deltaPct)}% week-over-week.`,
    metricSource: "website_metrics.activationRate",
    currentValue: current,
    previousValue: previous,
    deltaPct,
  };
}

export async function checkSignupsDrop(thresholds: AlertThresholds): Promise<AlertCandidate | null> {
  const rows = await last14DaysWebsiteMetrics();
  if (rows.length < 14) return null;
  const series = toSeries(rows, "signups");
  const current = sumSeries(series.slice(-7));
  const previous = sumSeries(series.slice(0, 7));
  const deltaPct = computeDeltaPct(current, previous);
  if (deltaPct > thresholds.signupsDropPct) return null;

  return {
    type: "signups_drop",
    severity: deltaPct <= thresholds.signupsDropPct * 2 ? "critical" : "warning",
    title: "Signups declining",
    message: `Signups fell ${Math.abs(deltaPct)}% week-over-week.`,
    metricSource: "website_metrics.signups",
    currentValue: current,
    previousValue: previous,
    deltaPct,
  };
}

export async function checkBacklinksLost(thresholds: AlertThresholds): Promise<AlertCandidate | null> {
  const latest = await prisma.seoMetric.findFirst({ orderBy: { date: "desc" } });
  if (!latest || latest.lostBacklinks < thresholds.backlinksLostThreshold) return null;

  return {
    type: "backlinks_lost",
    severity: latest.lostBacklinks >= thresholds.backlinksLostThreshold * 2 ? "critical" : "warning",
    title: "Backlinks lost",
    message: `${latest.lostBacklinks} referring domains were lost on ${latest.date.toISOString().slice(0, 10)}.`,
    metricSource: "seo_metrics.lostBacklinks",
    currentValue: latest.lostBacklinks,
    previousValue: 0,
    deltaPct: 0,
  };
}

export async function checkKeywordRankingDrop(thresholds: AlertThresholds): Promise<AlertCandidate | null> {
  const latestChecked = await prisma.keywordRanking.findFirst({ orderBy: { checkedAt: "desc" } });
  if (!latestChecked) return null;

  const worst = await prisma.keywordRanking.findFirst({
    where: { checkedAt: latestChecked.checkedAt, movement: { lte: thresholds.keywordMovementDrop } },
    orderBy: { movement: "asc" },
  });
  if (!worst) return null;

  return {
    type: "keyword_drop",
    severity: worst.movement <= thresholds.keywordMovementDrop * 2 ? "critical" : "warning",
    title: "Keyword ranking dropped",
    message: `"${worst.keyword}" dropped from position ${worst.previousPosition} to ${worst.currentPosition}.`,
    metricSource: "keyword_rankings",
    currentValue: worst.currentPosition,
    previousValue: worst.previousPosition,
    deltaPct: computeDeltaPct(worst.currentPosition, worst.previousPosition),
  };
}

export async function checkMentionSpike(thresholds: AlertThresholds): Promise<AlertCandidate | null> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const [current, previous] = await Promise.all([
    prisma.redditMention.count({ where: { mentionedAt: { gte: oneDayAgo, lte: now } } }),
    prisma.redditMention.count({ where: { mentionedAt: { gte: twoDaysAgo, lt: oneDayAgo } } }),
  ]);

  if (previous === 0 || current < previous * thresholds.mentionSpikeMultiplier) return null;

  return {
    type: "mention_spike",
    severity: current >= previous * thresholds.mentionSpikeMultiplier * 2 ? "critical" : "warning",
    title: "Reddit mentions spiking",
    message: `Organic Reddit mentions jumped from ${previous} to ${current} in the last 24 hours.`,
    metricSource: "reddit_mentions",
    currentValue: current,
    previousValue: previous,
    deltaPct: computeDeltaPct(current, previous),
  };
}

export const ALERT_RULES = [
  checkTrafficDrop,
  checkActivationDrop,
  checkSignupsDrop,
  checkBacklinksLost,
  checkKeywordRankingDrop,
  checkMentionSpike,
];
