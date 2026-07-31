import { Router } from "express";
import { prisma } from "../../db/prisma-client";
import { validateQuery } from "../middleware/validate";
import { sendData } from "../utils/api-response";
import { resolveDateRange, resolvePreviousWindow } from "../utils/query-parser";
import { websiteOverviewQuerySchema, type WebsiteOverviewQuery } from "../schemas/website.schema";
import { buildKpiMetric, type TimeSeriesPoint } from "../../services/analytics/growth";
import type { ShareSlice, FunnelStep } from "../../integrations/posthog/types";

export const websiteRouter = Router();

function toSeries<T extends { date: Date }>(rows: T[], key: keyof T): TimeSeriesPoint[] {
  return rows.map((row) => ({ date: row.date.toISOString().slice(0, 10), value: Number(row[key]) }));
}

function inWindow(series: TimeSeriesPoint[], window: { from: Date; to: Date }): TimeSeriesPoint[] {
  const fromIso = window.from.toISOString().slice(0, 10);
  const toIso = window.to.toISOString().slice(0, 10);
  return series.filter((p) => p.date >= fromIso && p.date <= toIso);
}

websiteRouter.get("/", validateQuery(websiteOverviewQuerySchema), async (req, res, next) => {
  try {
    const query = req.parsedQuery as WebsiteOverviewQuery;
    const current = resolveDateRange(query);
    const previous = resolvePreviousWindow(current, query.compare) ?? {
      from: new Date(current.from.getTime() - (current.to.getTime() - current.from.getTime())),
      to: current.from,
    };

    const rows = await prisma.websiteMetric.findMany({
      where: { date: { gte: previous.from, lte: current.to } },
      orderBy: { date: "asc" },
    });

    const buildChart = (key: "visitors" | "uniqueVisitors" | "returningVisitors" | "signups") => {
      const full = toSeries(rows, key);
      return { current: inWindow(full, current), previous: inWindow(full, previous) };
    };

    const avgSessionDurationFull = toSeries(rows, "avgSessionDurationSec");
    const bounceRateFull = toSeries(rows, "bounceRate");

    const latest = rows[rows.length - 1];

    const response = {
      kpis: {
        avgSessionDuration: buildKpiMetric({
          id: "avg-session-duration",
          label: "Average Session Duration",
          format: "duration",
          current: inWindow(avgSessionDurationFull, current),
          previous: inWindow(avgSessionDurationFull, previous),
          aggregate: "average",
        }),
        bounceRate: buildKpiMetric({
          id: "bounce-rate",
          label: "Bounce Rate",
          format: "percent",
          current: inWindow(bounceRateFull, current),
          previous: inWindow(bounceRateFull, previous),
          aggregate: "average",
          positiveIsGood: false,
        }),
      },
      charts: {
        visitors: buildChart("visitors"),
        uniqueVisitors: buildChart("uniqueVisitors"),
        returningVisitors: buildChart("returningVisitors"),
        signups: buildChart("signups"),
        trafficSources: (latest?.trafficSources ?? []) as ShareSlice[],
        deviceBreakdown: (latest?.deviceBreakdown ?? []) as ShareSlice[],
        countryBreakdown: (latest?.countryBreakdown ?? []) as ShareSlice[],
        activationFunnel: (latest?.activationFunnel ?? []) as FunnelStep[],
        conversionFunnel: (latest?.conversionFunnel ?? []) as FunnelStep[],
      },
      tables: {
        topLandingPages: latest?.topLandingPages ?? [],
        topExitPages: latest?.topExitPages ?? [],
      },
    };

    sendData(res, response, { range: current, compare: query.compare });
  } catch (error) {
    next(error);
  }
});
