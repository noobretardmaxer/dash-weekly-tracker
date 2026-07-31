import { Router } from "express";
import { prisma } from "../../db/prisma-client";
import { validateQuery } from "../middleware/validate";
import { sendData } from "../utils/api-response";
import { resolveDateRange, resolvePreviousWindow } from "../utils/query-parser";
import { twitterOverviewQuerySchema, type TwitterOverviewQuery } from "../schemas/twitter.schema";
import { buildKpiMetric, type TimeSeriesPoint } from "../../services/analytics/growth";

export const twitterRouter = Router();

function toSeries<T extends { date: Date }>(rows: T[], key: keyof T): TimeSeriesPoint[] {
  return rows.map((row) => ({ date: row.date.toISOString().slice(0, 10), value: Number(row[key]) }));
}

function inWindow(series: TimeSeriesPoint[], window: { from: Date; to: Date }): TimeSeriesPoint[] {
  const fromIso = window.from.toISOString().slice(0, 10);
  const toIso = window.to.toISOString().slice(0, 10);
  return series.filter((p) => p.date >= fromIso && p.date <= toIso);
}

twitterRouter.get("/", validateQuery(twitterOverviewQuerySchema), async (req, res, next) => {
  try {
    const query = req.parsedQuery as TwitterOverviewQuery;
    const current = resolveDateRange(query);
    const previous = resolvePreviousWindow(current, query.compare) ?? {
      from: new Date(current.from.getTime() - (current.to.getTime() - current.from.getTime())),
      to: current.from,
    };

    const rows = await prisma.twitterMetric.findMany({
      where: { date: { gte: previous.from, lte: current.to } },
      orderBy: { date: "asc" },
    });

    const buildChart = (key: "followers" | "newFollowers" | "mentions" | "profileVisits" | "engagementRate" | "linkClicks") => {
      const full = toSeries(rows, key);
      return { current: inWindow(full, current), previous: inWindow(full, previous) };
    };

    const followersFull = toSeries(rows, "followers");
    const engagementRateFull = toSeries(rows, "engagementRate");

    const latest = rows[rows.length - 1];

    const response = {
      kpis: {
        followers: buildKpiMetric({
          id: "followers",
          label: "Followers",
          format: "compact",
          current: inWindow(followersFull, current),
          previous: inWindow(followersFull, previous),
          aggregate: "last",
          positiveIsGood: true,
        }),
        engagementRate: buildKpiMetric({
          id: "engagement-rate",
          label: "Engagement Rate",
          format: "percent",
          current: inWindow(engagementRateFull, current),
          previous: inWindow(engagementRateFull, previous),
          aggregate: "average",
          positiveIsGood: true,
        }),
      },
      charts: {
        followers: buildChart("followers"),
        newFollowers: buildChart("newFollowers"),
        mentions: buildChart("mentions"),
        profileVisits: buildChart("profileVisits"),
        linkClicks: buildChart("linkClicks"),
      },
      tables: {
        topTweets: latest?.topTweets ?? [],
      },
    };

    sendData(res, response, { range: current, compare: query.compare });
  } catch (error) {
    next(error);
  }
});
