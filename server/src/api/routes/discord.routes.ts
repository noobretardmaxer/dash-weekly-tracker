import { Router } from "express";
import { prisma } from "../../db/prisma-client";
import { validateQuery } from "../middleware/validate";
import { sendData } from "../utils/api-response";
import { resolveDateRange, resolvePreviousWindow } from "../utils/query-parser";
import { discordOverviewQuerySchema, type DiscordOverviewQuery } from "../schemas/discord.schema";
import { buildKpiMetric, type TimeSeriesPoint } from "../../services/analytics/growth";

export const discordRouter = Router();

function toSeries<T extends { date: Date }>(rows: T[], key: keyof T): TimeSeriesPoint[] {
  return rows.map((row) => ({ date: row.date.toISOString().slice(0, 10), value: Number(row[key]) }));
}

function inWindow(series: TimeSeriesPoint[], window: { from: Date; to: Date }): TimeSeriesPoint[] {
  const fromIso = window.from.toISOString().slice(0, 10);
  const toIso = window.to.toISOString().slice(0, 10);
  return series.filter((p) => p.date >= fromIso && p.date <= toIso);
}

discordRouter.get("/", validateQuery(discordOverviewQuerySchema), async (req, res, next) => {
  try {
    const query = req.parsedQuery as DiscordOverviewQuery;
    const current = resolveDateRange(query);
    const previous = resolvePreviousWindow(current, query.compare) ?? {
      from: new Date(current.from.getTime() - (current.to.getTime() - current.from.getTime())),
      to: current.from,
    };

    const rows = await prisma.discordMetric.findMany({
      where: { date: { gte: previous.from, lte: current.to } },
      orderBy: { date: "asc" },
    });

    const buildChart = (key: "memberCount" | "dau" | "wau" | "messages") => {
      const full = toSeries(rows, key);
      return { current: inWindow(full, current), previous: inWindow(full, previous) };
    };

    const memberCountFull = toSeries(rows, "memberCount");
    const dauFull = toSeries(rows, "dau");

    const latest = rows[rows.length - 1];

    const response = {
      kpis: {
        memberCount: buildKpiMetric({
          id: "member-count",
          label: "Member Count",
          format: "compact",
          current: inWindow(memberCountFull, current),
          previous: inWindow(memberCountFull, previous),
          aggregate: "last",
          positiveIsGood: true,
        }),
        dau: buildKpiMetric({
          id: "dau",
          label: "Daily Active Users",
          format: "compact",
          current: inWindow(dauFull, current),
          previous: inWindow(dauFull, previous),
          aggregate: "average",
          positiveIsGood: true,
        }),
      },
      charts: {
        memberCount: buildChart("memberCount"),
        dau: buildChart("dau"),
        wau: buildChart("wau"),
        messages: buildChart("messages"),
      },
      tables: {
        topChannels: latest?.topChannels ?? [],
        mostActiveMembers: latest?.mostActiveMembers ?? [],
      },
    };

    sendData(res, response, { range: current, compare: query.compare });
  } catch (error) {
    next(error);
  }
});
