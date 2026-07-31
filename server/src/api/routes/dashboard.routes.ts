import { Router } from "express";
import { prisma } from "../../db/prisma-client";
import { validateQuery } from "../middleware/validate";
import { sendData } from "../utils/api-response";
import { resolveDateRange, resolvePreviousWindow, type ResolvedDateRange } from "../utils/query-parser";
import { dashboardOverviewQuerySchema, type DashboardOverviewQuery } from "../schemas/dashboard.schema";
import { buildKpiMetric, type TimeSeriesPoint, type KpiMetric } from "../../services/analytics/growth";

export const dashboardRouter = Router();

function toSeries<T extends { date: Date }>(rows: T[], key: keyof T): TimeSeriesPoint[] {
  return rows.map((row) => ({ date: row.date.toISOString().slice(0, 10), value: Number(row[key]) }));
}

function inWindow(series: TimeSeriesPoint[], window: ResolvedDateRange): TimeSeriesPoint[] {
  const fromIso = window.from.toISOString().slice(0, 10);
  const toIso = window.to.toISOString().slice(0, 10);
  return series.filter((p) => p.date >= fromIso && p.date <= toIso);
}

async function fetchLatestTopTenKeywordCount(): Promise<number> {
  const latest = await prisma.keywordRanking.findFirst({ orderBy: { checkedAt: "desc" } });
  if (!latest) return 0;
  return prisma.keywordRanking.count({ where: { checkedAt: latest.checkedAt, currentPosition: { lte: 10 } } });
}

dashboardRouter.get("/", validateQuery(dashboardOverviewQuerySchema), async (req, res, next) => {
  try {
    const query = req.parsedQuery as DashboardOverviewQuery;
    const current = resolveDateRange(query);
    const previous = resolvePreviousWindow(current, query.compare) ?? {
      from: new Date(current.from.getTime() - (current.to.getTime() - current.from.getTime())),
      to: current.from,
    };

    const [websiteRows, searchConsoleRows, seoRows, twitterRows, discordRows, redditCurrentCount, redditPreviousCount, topTenKeywordCount] =
      await Promise.all([
        prisma.websiteMetric.findMany({ where: { date: { gte: previous.from, lte: current.to } }, orderBy: { date: "asc" } }),
        prisma.searchConsoleMetric.findMany({ where: { date: { gte: previous.from, lte: current.to } }, orderBy: { date: "asc" } }),
        prisma.seoMetric.findMany({ where: { date: { gte: previous.from, lte: current.to } }, orderBy: { date: "asc" } }),
        prisma.twitterMetric.findMany({ where: { date: { gte: previous.from, lte: current.to } }, orderBy: { date: "asc" } }),
        prisma.discordMetric.findMany({ where: { date: { gte: previous.from, lte: current.to } }, orderBy: { date: "asc" } }),
        prisma.redditMention.count({ where: { mentionedAt: { gte: current.from, lte: current.to } } }),
        prisma.redditMention.count({ where: { mentionedAt: { gte: previous.from, lte: previous.to } } }),
        fetchLatestTopTenKeywordCount(),
      ]);

    const visitorsFull = toSeries(websiteRows, "visitors");
    const uniqueVisitorsFull = toSeries(websiteRows, "uniqueVisitors");
    const signupsFull = toSeries(websiteRows, "signups");
    const activationRateFull = toSeries(websiteRows, "activationRate");
    const clicksFull = toSeries(searchConsoleRows, "clicks");
    const avgPositionFull = toSeries(searchConsoleRows, "avgPosition");
    const followersFull = toSeries(twitterRows, "followers");
    const memberCountFull = toSeries(discordRows, "memberCount");
    const backlinksFull = toSeries(seoRows, "backlinks");
    const referringDomainsFull = toSeries(seoRows, "referringDomains");

    const kpi = (
      id: string,
      label: string,
      format: KpiMetric["format"],
      full: TimeSeriesPoint[],
      aggregate: "sum" | "average" | "last",
      positiveIsGood = true
    ): KpiMetric =>
      buildKpiMetric({
        id,
        label,
        format,
        current: inWindow(full, current),
        previous: inWindow(full, previous),
        aggregate,
        positiveIsGood,
      });

    const kpiGrid: KpiMetric[] = [
      kpi("visitors", "Website Visitors", "compact", visitorsFull, "sum"),
      kpi("unique-visitors", "Unique Visitors", "compact", uniqueVisitorsFull, "sum"),
      kpi("signups", "Sign-ups", "number", signupsFull, "sum"),
      kpi("activation-rate", "Activation Rate", "percent", activationRateFull, "average"),
      kpi("organic-clicks", "Organic Search Clicks", "compact", clicksFull, "sum"),
      kpi("avg-position", "Average Position", "position", avgPositionFull, "average", false),
      kpi("twitter-followers", "Twitter Followers", "compact", followersFull, "last"),
      kpi("discord-members", "Discord Members", "compact", memberCountFull, "last"),
      buildKpiMetric({
        id: "reddit-mentions",
        label: "Organic Reddit Mentions",
        format: "number",
        current: [{ date: current.to.toISOString().slice(0, 10), value: redditCurrentCount }],
        previous: [{ date: previous.to.toISOString().slice(0, 10), value: redditPreviousCount }],
        aggregate: "sum",
      }),
      kpi("backlinks", "Backlinks", "compact", backlinksFull, "last"),
      kpi("referring-domains", "Referring Domains", "compact", referringDomainsFull, "last"),
      {
        id: "top-keywords",
        label: "Top Ranking Keywords",
        value: topTenKeywordCount,
        format: "number",
        deltaPct: 0,
        positiveIsGood: true,
        series: [],
      },
    ];

    const previewCharts = {
      visitors: { current: inWindow(visitorsFull, current), previous: inWindow(visitorsFull, previous) },
      organicClicks: { current: inWindow(clicksFull, current), previous: inWindow(clicksFull, previous) },
      backlinks: { current: inWindow(backlinksFull, current), previous: inWindow(backlinksFull, previous) },
    };

    sendData(res, { kpiGrid, previewCharts }, { range: current, compare: query.compare });
  } catch (error) {
    next(error);
  }
});
