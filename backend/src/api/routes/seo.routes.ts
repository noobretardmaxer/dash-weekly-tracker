import { Router } from "express";
import { prisma } from "../../db/prisma-client";
import { validateQuery } from "../middleware/validate";
import { sendData, sendPaginated } from "../utils/api-response";
import { parseSort, resolveDateRange, resolvePreviousWindow } from "../utils/query-parser";
import { keywordListQuerySchema, seoOverviewQuerySchema, type KeywordListQuery, type SeoOverviewQuery } from "../schemas/seo.schema";
import { buildKpiMetric, type TimeSeriesPoint } from "../../services/analytics/growth";
import type { SeoTopPage, KeywordMovement, CompetitorProfileRow, AuthorityBucket, RefDomainRow, AnchorRow, TldRow } from "../../integrations/semrush/types";

export const seoRouter = Router();

function toSeries<T extends { date: Date }>(rows: T[], key: keyof T): TimeSeriesPoint[] {
  return rows.map((row) => ({ date: row.date.toISOString().slice(0, 10), value: Number(row[key]) }));
}

function inWindow(series: TimeSeriesPoint[], window: { from: Date; to: Date }): TimeSeriesPoint[] {
  const fromIso = window.from.toISOString().slice(0, 10);
  const toIso = window.to.toISOString().slice(0, 10);
  return series.filter((p) => p.date >= fromIso && p.date <= toIso);
}

seoRouter.get("/", validateQuery(seoOverviewQuerySchema), async (req, res, next) => {
  try {
    const query = req.parsedQuery as SeoOverviewQuery;
    const current = resolveDateRange(query);
    const previous = resolvePreviousWindow(current, query.compare) ?? {
      from: new Date(current.from.getTime() - (current.to.getTime() - current.from.getTime())),
      to: current.from,
    };

    const rows = await prisma.seoMetric.findMany({
      where: { date: { gte: previous.from, lte: current.to } },
      orderBy: { date: "asc" },
    });

    const buildChart = (
      key: "organicTraffic" | "organicKeywords" | "authorityScore" | "backlinks" | "referringDomains" | "newBacklinks" | "lostBacklinks"
    ) => {
      const full = toSeries(rows, key);
      return { current: inWindow(full, current), previous: inWindow(full, previous) };
    };

    const organicTrafficFull = toSeries(rows, "organicTraffic");
    const authorityScoreFull = toSeries(rows, "authorityScore");
    const organicKeywordsFull = toSeries(rows, "organicKeywords");
    const backlinksFull = toSeries(rows, "backlinks");
    const referringDomainsFull = toSeries(rows, "referringDomains");
    const newBacklinksFull = toSeries(rows, "newBacklinks");
    const lostBacklinksFull = toSeries(rows, "lostBacklinks");

    const latest = rows[rows.length - 1];

    const response = {
      kpis: {
        organicTraffic: buildKpiMetric({
          id: "organic-traffic",
          label: "Organic Traffic",
          format: "compact",
          current: inWindow(organicTrafficFull, current),
          previous: inWindow(organicTrafficFull, previous),
          aggregate: "sum",
          positiveIsGood: true,
        }),
        organicKeywords: buildKpiMetric({
          id: "organic-keywords",
          label: "Organic Keywords",
          format: "compact",
          current: inWindow(organicKeywordsFull, current),
          previous: inWindow(organicKeywordsFull, previous),
          aggregate: "last",
          positiveIsGood: true,
        }),
        authorityScore: buildKpiMetric({
          id: "authority-score",
          label: "Authority Score",
          format: "number",
          current: inWindow(authorityScoreFull, current),
          previous: inWindow(authorityScoreFull, previous),
          aggregate: "average",
          positiveIsGood: true,
        }),
        backlinks: buildKpiMetric({
          id: "backlinks",
          label: "Backlinks",
          format: "compact",
          current: inWindow(backlinksFull, current),
          previous: inWindow(backlinksFull, previous),
          aggregate: "last",
          positiveIsGood: true,
        }),
        referringDomains: buildKpiMetric({
          id: "referring-domains",
          label: "Referring Domains",
          format: "compact",
          current: inWindow(referringDomainsFull, current),
          previous: inWindow(referringDomainsFull, previous),
          aggregate: "last",
          positiveIsGood: true,
        }),
        lostBacklinks: buildKpiMetric({
          id: "lost-backlinks",
          label: "Lost Backlinks",
          format: "number",
          current: inWindow(lostBacklinksFull, current),
          previous: inWindow(lostBacklinksFull, previous),
          aggregate: "sum",
          positiveIsGood: false,
        }),
        newBacklinks: buildKpiMetric({
          id: "new-backlinks",
          label: "New Backlinks",
          format: "number",
          current: inWindow(newBacklinksFull, current),
          previous: inWindow(newBacklinksFull, previous),
          aggregate: "sum",
          positiveIsGood: true,
        }),
      },
      charts: {
        organicTraffic: buildChart("organicTraffic"),
        organicKeywords: buildChart("organicKeywords"),
        authorityScore: buildChart("authorityScore"),
        backlinks: buildChart("backlinks"),
        referringDomains: buildChart("referringDomains"),
        newBacklinks: buildChart("newBacklinks"),
        lostBacklinks: buildChart("lostBacklinks"),
      },
      tables: {
        topPages: (latest?.topPages ?? []) as SeoTopPage[],
        fastestGrowingKeywords: (latest?.fastestGrowingKeywords ?? []) as KeywordMovement[],
        losingKeywords: (latest?.losingKeywords ?? []) as KeywordMovement[],
      },
      // Freshness/source so the UI can label the data and flag stale snapshots
      // instead of passing off an old sync as current.
      source: "semrush" as const,
      asOf: latest?.date ?? null,
    };

    sendData(res, response, { range: current, compare: query.compare, source: "semrush", asOf: latest?.date ?? null });
  } catch (error) {
    next(error);
  }
});

const KEYWORD_SORT_FIELDS = ["currentPosition", "searchVolume", "movement", "clicks", "difficulty"] as const;
type KeywordSortField = (typeof KEYWORD_SORT_FIELDS)[number];

seoRouter.get("/keywords", validateQuery(keywordListQuerySchema), async (req, res, next) => {
  try {
    const query = req.parsedQuery as KeywordListQuery;

    const latest = await prisma.keywordRanking.findFirst({ orderBy: { checkedAt: "desc" } });
    if (!latest) {
      sendPaginated(res, [], { page: query.page, pageSize: query.pageSize, total: 0 });
      return;
    }

    const where = {
      checkedAt: latest.checkedAt,
      ...(query.search ? { keyword: { contains: query.search, mode: "insensitive" as const } } : {}),
    };

    const parsedSort = parseSort(query.sort, [...KEYWORD_SORT_FIELDS]);
    const sortField: KeywordSortField = (parsedSort?.field as KeywordSortField | undefined) ?? "currentPosition";
    const sortDirection = parsedSort?.direction ?? "asc";
    const orderBy: Record<KeywordSortField, "asc" | "desc"> = { [sortField]: sortDirection } as Record<KeywordSortField, "asc" | "desc">;

    const [rows, total] = await Promise.all([
      prisma.keywordRanking.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.keywordRanking.count({ where }),
    ]);

    sendPaginated(res, rows, { page: query.page, pageSize: query.pageSize, total });
  } catch (error) {
    next(error);
  }
});

seoRouter.get("/competitors", async (_req, res, next) => {
  try {
    const latest = await prisma.competitorMetric.findFirst({ orderBy: { date: "desc" } });
    if (!latest) {
      sendData(res, [] as CompetitorProfileRow[]);
      return;
    }

    const rows = await prisma.competitorMetric.findMany({
      where: { date: latest.date },
      orderBy: { organicTraffic: "desc" },
    });

    sendData(res, rows);
  } catch (error) {
    next(error);
  }
});

seoRouter.get("/backlinks", validateQuery(seoOverviewQuerySchema), async (req, res, next) => {
  try {
    const query = req.parsedQuery as SeoOverviewQuery;
    const current = resolveDateRange(query);
    const previous = resolvePreviousWindow(current, query.compare) ?? {
      from: new Date(current.from.getTime() - (current.to.getTime() - current.from.getTime())),
      to: current.from,
    };

    const rows = await prisma.seoMetric.findMany({
      where: { date: { gte: previous.from, lte: current.to } },
      orderBy: { date: "asc" },
    });

    const backlinksFull = toSeries(rows, "backlinks");
    const referringDomainsFull = toSeries(rows, "referringDomains");
    const newBacklinksFull = toSeries(rows, "newBacklinks");
    const lostBacklinksFull = toSeries(rows, "lostBacklinks");

    const latest = rows[rows.length - 1];

    const response = {
      kpis: {
        backlinks: buildKpiMetric({
          id: "backlinks",
          label: "Backlinks",
          format: "compact",
          current: inWindow(backlinksFull, current),
          previous: inWindow(backlinksFull, previous),
          aggregate: "last",
          positiveIsGood: true,
        }),
        referringDomains: buildKpiMetric({
          id: "referring-domains",
          label: "Referring Domains",
          format: "compact",
          current: inWindow(referringDomainsFull, current),
          previous: inWindow(referringDomainsFull, previous),
          aggregate: "last",
          positiveIsGood: true,
        }),
        newBacklinks: buildKpiMetric({
          id: "new-backlinks",
          label: "New Backlinks (7d)",
          format: "number",
          current: inWindow(newBacklinksFull, current),
          previous: inWindow(newBacklinksFull, previous),
          aggregate: "sum",
          positiveIsGood: true,
        }),
        lostBacklinks: buildKpiMetric({
          id: "lost-backlinks",
          label: "Lost Backlinks (7d)",
          format: "number",
          current: inWindow(lostBacklinksFull, current),
          previous: inWindow(lostBacklinksFull, previous),
          aggregate: "sum",
          positiveIsGood: false,
        }),
      },
      charts: {
        backlinks: {
          current: inWindow(backlinksFull, current),
          previous: inWindow(backlinksFull, previous),
        },
        referringDomains: {
          current: inWindow(referringDomainsFull, current),
          previous: inWindow(referringDomainsFull, previous),
        },
      },
      refDomainsByAuthority: (latest?.refDomainsByAuthority ?? []) as AuthorityBucket[],
      topRefDomains: (latest?.topRefDomains ?? []) as RefDomainRow[],
      topAnchors: (latest?.topAnchors ?? []) as AnchorRow[],
      topTlds: (latest?.topTlds ?? []) as TldRow[],
      source: "semrush" as const,
      asOf: latest?.date ?? null,
    };

    sendData(res, response, { range: current, compare: query.compare, source: "semrush", asOf: latest?.date ?? null });
  } catch (error) {
    next(error);
  }
});
