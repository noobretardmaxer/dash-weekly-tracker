import { Router } from "express";
import { prisma } from "../../db/prisma-client";
import { validateQuery } from "../middleware/validate";
import { sendData } from "../utils/api-response";
import { resolveDateRange, resolvePreviousWindow } from "../utils/query-parser";
import { searchConsoleOverviewQuerySchema, type SearchConsoleOverviewQuery } from "../schemas/search-console.schema";
import { buildKpiMetric, type TimeSeriesPoint } from "../../services/analytics/growth";
import type { QueryRow, PageRow, CountryRow, DeviceRow, SearchAppearanceRow } from "../../integrations/gsc/types";

export const searchConsoleRouter = Router();

function toSeries<T extends { date: Date }>(rows: T[], key: keyof T): TimeSeriesPoint[] {
  return rows.map((row) => ({ date: row.date.toISOString().slice(0, 10), value: Number(row[key]) }));
}

function inWindow(series: TimeSeriesPoint[], window: { from: Date; to: Date }): TimeSeriesPoint[] {
  const fromIso = window.from.toISOString().slice(0, 10);
  const toIso = window.to.toISOString().slice(0, 10);
  return series.filter((p) => p.date >= fromIso && p.date <= toIso);
}

searchConsoleRouter.get("/", validateQuery(searchConsoleOverviewQuerySchema), async (req, res, next) => {
  try {
    const query = req.parsedQuery as SearchConsoleOverviewQuery;
    const current = resolveDateRange(query);
    const previous = resolvePreviousWindow(current, query.compare) ?? {
      from: new Date(current.from.getTime() - (current.to.getTime() - current.from.getTime())),
      to: current.from,
    };

    const rows = await prisma.searchConsoleMetric.findMany({
      where: { date: { gte: previous.from, lte: current.to } },
      orderBy: { date: "asc" },
    });

    const buildChart = (key: "clicks" | "impressions" | "ctr" | "avgPosition") => {
      const full = toSeries(rows, key);
      return { current: inWindow(full, current), previous: inWindow(full, previous) };
    };

    const clicksFull = toSeries(rows, "clicks");
    const avgPositionFull = toSeries(rows, "avgPosition");

    const latest = rows[rows.length - 1];

    const response = {
      kpis: {
        clicks: buildKpiMetric({
          id: "clicks",
          label: "Clicks",
          format: "compact",
          current: inWindow(clicksFull, current),
          previous: inWindow(clicksFull, previous),
          aggregate: "sum",
          positiveIsGood: true,
        }),
        avgPosition: buildKpiMetric({
          id: "avg-position",
          label: "Average Position",
          format: "position",
          current: inWindow(avgPositionFull, current),
          previous: inWindow(avgPositionFull, previous),
          aggregate: "average",
          positiveIsGood: false,
        }),
      },
      charts: {
        clicks: buildChart("clicks"),
        impressions: buildChart("impressions"),
        ctr: buildChart("ctr"),
        avgPosition: buildChart("avgPosition"),
      },
      tables: {
        topQueries: (latest?.topQueries ?? []) as QueryRow[],
        topPages: (latest?.topPages ?? []) as PageRow[],
        countries: (latest?.countries ?? []) as CountryRow[],
        devices: (latest?.devices ?? []) as DeviceRow[],
        searchAppearance: (latest?.searchAppearance ?? []) as SearchAppearanceRow[],
      },
    };

    sendData(res, response, { range: current, compare: query.compare });
  } catch (error) {
    next(error);
  }
});
