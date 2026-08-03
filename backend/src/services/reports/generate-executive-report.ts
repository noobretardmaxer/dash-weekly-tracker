import { prisma } from "../../db/prisma-client";
import { logger } from "../../lib/logger";
import { computeDeltaPct, sumSeries, averageSeries, type TimeSeriesPoint } from "../analytics/growth";
import { growthScore, healthScore } from "../analytics/scores";
import { buildAiSummary, buildRecommendations, buildRisks, buildWins } from "./templates";

const RANGE_DAYS = 7;

function toSeries<T extends { date: Date }>(rows: T[], key: keyof T): TimeSeriesPoint[] {
  return [...rows].reverse().map((row) => ({ date: row.date.toISOString().slice(0, 10), value: Number(row[key]) }));
}

export type ExecutiveReportPayload = {
  executiveSummary: string;
  wins: { id: string; text: string }[];
  risks: { id: string; text: string }[];
  recommendations: { id: string; text: string }[];
  growthScore: number;
  healthScore: number;
  topOpportunities: { id: string; text: string }[];
  topRisks: { id: string; text: string }[];
};

export async function generateExecutiveReport(): Promise<{ id: string }> {
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - RANGE_DAYS * 24 * 60 * 60 * 1000);

  const report = await prisma.report.create({
    data: {
      name: `Weekly Executive Summary — ${periodEnd.toISOString().slice(0, 10)}`,
      type: "Weekly Executive Summary",
      status: "Generating",
      periodStart,
      periodEnd,
      payload: {},
    },
  });

  try {
    const [websiteRows, seoRows, keywordRows, openCriticalAlerts, topRedditMentions] = await Promise.all([
      prisma.websiteMetric.findMany({ orderBy: { date: "desc" }, take: RANGE_DAYS * 2 }),
      prisma.seoMetric.findMany({ orderBy: { date: "desc" }, take: RANGE_DAYS * 2 }),
      prisma.keywordRanking.findMany({ orderBy: { checkedAt: "desc" }, take: 200 }),
      prisma.alert.findMany({ where: { status: "open", severity: "critical" }, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.redditMention.findMany({ orderBy: [{ score: "desc" }], take: 5 }),
    ]);

    const visitors = toSeries(websiteRows, "visitors");
    const activationRate = toSeries(websiteRows, "activationRate");
    const clicksFromSeo = toSeries(seoRows, "organicTraffic");
    const newBacklinks = toSeries(seoRows, "newBacklinks");
    const lostBacklinks = toSeries(seoRows, "lostBacklinks");

    const websiteTrafficDeltaPct = computeDeltaPct(sumSeries(visitors.slice(-7)), sumSeries(visitors.slice(0, 7)));
    const organicClicksDeltaPct = computeDeltaPct(sumSeries(clicksFromSeo.slice(-7)), sumSeries(clicksFromSeo.slice(0, 7)));
    const activationRateDeltaPct = computeDeltaPct(averageSeries(activationRate.slice(-7)), averageSeries(activationRate.slice(0, 7)));
    const newBacklinksThisWeek = Math.round(sumSeries(newBacklinks.slice(-7)));
    const lostBacklinksThisWeek = Math.round(sumSeries(lostBacklinks.slice(-7)));

    const latestChecked = keywordRows[0]?.checkedAt;
    const breakoutKeyword = keywordRows.find(
      (k) => k.checkedAt.getTime() === latestChecked?.getTime() && k.currentPosition <= 10 && k.previousPosition > 10
    );

    const fastestGrowing = [...keywordRows]
      .filter((k) => k.checkedAt.getTime() === latestChecked?.getTime())
      .sort((a, b) => b.movement - a.movement)
      .slice(0, 5);
    const losing = [...keywordRows]
      .filter((k) => k.checkedAt.getTime() === latestChecked?.getTime())
      .sort((a, b) => a.movement - b.movement)
      .slice(0, 5);

    const gScore = growthScore({ websiteTrafficDeltaPct, organicClicksDeltaPct, newBacklinksThisWeek });
    const hScore = healthScore({ activationRateDeltaPct });

    const wins = buildWins({
      websiteTrafficDeltaPct,
      organicClicksDeltaPct,
      newBacklinksThisWeek,
      breakoutKeyword: breakoutKeyword?.keyword,
    });
    const risks = buildRisks({ activationRateDeltaPct, lostBacklinksThisWeek });
    const recommendations = buildRecommendations();
    const executiveSummary = buildAiSummary({
      websiteTrafficDeltaPct,
      organicClicksDeltaPct,
      activationRateDeltaPct,
      newBacklinksThisWeek,
      breakoutKeyword: breakoutKeyword?.keyword,
    });

    const topOpportunities = [
      ...fastestGrowing.map((k) => ({ id: `kw-${k.id}`, text: `"${k.keyword}" climbed ${k.movement} positions to #${k.currentPosition}.` })),
      ...topRedditMentions.slice(0, 2).map((m) => ({ id: `reddit-${m.id}`, text: `Breakout thread in ${m.subreddit}: "${m.postTitle}" (${m.score} upvotes).` })),
    ];

    const topRisks = [
      ...openCriticalAlerts.map((a) => ({ id: `alert-${a.id}`, text: a.title })),
      ...losing.map((k) => ({ id: `kw-${k.id}`, text: `"${k.keyword}" dropped ${Math.abs(k.movement)} positions to #${k.currentPosition}.` })),
    ];

    const payload: ExecutiveReportPayload = {
      executiveSummary,
      wins,
      risks,
      recommendations,
      growthScore: gScore,
      healthScore: hScore,
      topOpportunities,
      topRisks,
    };

    await prisma.report.update({ where: { id: report.id }, data: { status: "Ready", payload: payload as object } });
    logger.info({ reportId: report.id }, "executive report generated");
    return { id: report.id };
  } catch (error) {
    await prisma.report.update({ where: { id: report.id }, data: { status: "Failed" } });
    logger.error({ err: error }, "executive report generation failed");
    throw error;
  }
}
