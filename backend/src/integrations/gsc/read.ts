import { Prisma, type GscProperty } from "@prisma/client";
import { prisma } from "../../db/prisma-client";
import { utcDateToYmd } from "../../lib/date/pacific";
import { aggregateRange } from "./aggregate";
import { getDefaultProperty } from "./properties";

/**
 * Read layer for the Search Console section. Everything the API serves comes
 * from here, and every range rollup goes through `aggregateRange` (or the
 * equivalent weighted SQL) so numbers match GSC. Nothing here calls Google.
 */

export type GscSearchType = "web" | "image" | "video" | "news" | "discover";
export type GscDimension = "query" | "page" | "country" | "device" | "search_appearance";
export type Granularity = "daily" | "weekly" | "monthly";

export interface Range {
  from: Date;
  to: Date;
}

const round1 = (n: number): number => Number(n.toFixed(1));

export async function resolveProperty(siteUrl?: string): Promise<GscProperty | null> {
  if (siteUrl) return prisma.gscProperty.findUnique({ where: { siteUrl } });
  return getDefaultProperty();
}

export async function listProperties(): Promise<GscProperty[]> {
  return prisma.gscProperty.findMany({ orderBy: { siteUrl: "asc" } });
}

/**
 * Daily web totals for the DEFAULT property, shaped for the executive dashboard
 * (which used to read the legacy `search_console_metrics` table). Returns []
 * when no property/data exists yet — an honest empty state, no regression.
 */
export async function getDefaultPropertyDailyTotals(
  from: Date,
  to: Date
): Promise<{ date: Date; clicks: number; avgPosition: number }[]> {
  const property = await getDefaultProperty();
  if (!property) return [];
  const rows = await prisma.gscDailyTotal.findMany({
    where: { propertyId: property.id, searchType: "web", date: { gte: from, lte: to } },
    orderBy: { date: "asc" },
  });
  return rows.map((r) => ({ date: r.date, clicks: r.clicks, avgPosition: r.position }));
}

interface DailyRow {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  dataState: string;
}

async function dailyTotals(propertyId: string, searchType: string, range: Range): Promise<DailyRow[]> {
  const rows = await prisma.gscDailyTotal.findMany({
    where: { propertyId, searchType, date: { gte: range.from, lte: range.to } },
    orderBy: { date: "asc" },
  });
  return rows.map((r) => ({
    date: utcDateToYmd(r.date),
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
    dataState: r.dataState,
  }));
}

// ---------------------------------------------------------------------------
// Summary — totals + deltas (correction: CTR/position are recomputed, weighted)
// ---------------------------------------------------------------------------

export interface MetricSummary {
  value: number;
  deltaPct: number | null; // null when there is no comparison window
}

export interface SummaryResult {
  clicks: MetricSummary;
  impressions: MetricSummary;
  ctr: MetricSummary;
  position: MetricSummary;
  provisional: boolean;
}

export async function getSummary(
  propertyId: string,
  searchType: string,
  current: Range,
  previous: Range | null
): Promise<SummaryResult> {
  const [cur, prev] = await Promise.all([
    dailyTotals(propertyId, searchType, current),
    previous ? dailyTotals(propertyId, searchType, previous) : Promise.resolve<DailyRow[]>([]),
  ]);
  const c = aggregateRange(cur);
  const p = aggregateRange(prev);
  const delta = (a: number, b: number): number | null => (previous && b !== 0 ? round1(((a - b) / b) * 100) : null);

  return {
    clicks: { value: c.clicks, deltaPct: delta(c.clicks, p.clicks) },
    impressions: { value: c.impressions, deltaPct: delta(c.impressions, p.impressions) },
    ctr: { value: c.ctr, deltaPct: delta(c.ctr, p.ctr) },
    position: { value: c.position, deltaPct: delta(c.position, p.position) },
    provisional: cur.some((r) => r.dataState === "provisional"),
  };
}

// ---------------------------------------------------------------------------
// Timeseries — daily/weekly/monthly, aggregated per bucket (never avg-of-avg)
// ---------------------------------------------------------------------------

export interface SeriesPoint {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export function bucketKey(ymd: string, granularity: Granularity): string {
  if (granularity === "daily") return ymd;
  const [y, m, d] = ymd.split("-").map(Number);
  if (granularity === "monthly") return `${y}-${String(m).padStart(2, "0")}-01`;
  // weekly: the Monday of that ISO week
  const dt = new Date(Date.UTC(y, m - 1, d));
  const mondayOffset = (dt.getUTCDay() + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - mondayOffset);
  return dt.toISOString().slice(0, 10);
}

function bucketSeries(rows: DailyRow[], granularity: Granularity): SeriesPoint[] {
  const groups = new Map<string, DailyRow[]>();
  for (const row of rows) {
    const key = bucketKey(row.date, granularity);
    const bucket = groups.get(key);
    if (bucket) bucket.push(row);
    else groups.set(key, [row]);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, groupRows]) => {
      const agg = aggregateRange(groupRows);
      return { date, clicks: agg.clicks, impressions: agg.impressions, ctr: agg.ctr, position: agg.position };
    });
}

export async function getTimeseries(
  propertyId: string,
  searchType: string,
  current: Range,
  previous: Range | null,
  granularity: Granularity
): Promise<{ current: SeriesPoint[]; previous: SeriesPoint[] }> {
  const [cur, prev] = await Promise.all([
    dailyTotals(propertyId, searchType, current),
    previous ? dailyTotals(propertyId, searchType, previous) : Promise.resolve<DailyRow[]>([]),
  ]);
  return { current: bucketSeries(cur, granularity), previous: bucketSeries(prev, granularity) };
}

// ---------------------------------------------------------------------------
// Dimension tables — weighted rollup in SQL, paginated / sorted / filtered
// ---------------------------------------------------------------------------

export type DimensionSortField = "clicks" | "impressions" | "ctr" | "position" | "value";

// Fixed allowlist → safe to inject via Prisma.raw (never user-controlled).
const SORT_SQL: Record<DimensionSortField, string> = {
  clicks: "clicks",
  impressions: "impressions",
  ctr: "ctr",
  position: "position",
  value: '"dimensionValue"',
};

export interface DimensionRow {
  value: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface DimensionResult {
  rows: DimensionRow[];
  total: number;
}

export async function getDimension(
  propertyId: string,
  searchType: string,
  dimension: GscDimension,
  range: Range,
  opts: { page: number; pageSize: number; sortField: DimensionSortField; sortDir: "asc" | "desc"; search?: string }
): Promise<DimensionResult> {
  const searchClause = opts.search ? Prisma.sql`AND "dimensionValue" ILIKE ${`%${opts.search}%`}` : Prisma.empty;
  const orderBy = Prisma.raw(`${SORT_SQL[opts.sortField]} ${opts.sortDir === "asc" ? "ASC" : "DESC"}`);
  const offset = (opts.page - 1) * opts.pageSize;

  const rows = await prisma.$queryRaw<DimensionRow[]>(Prisma.sql`
    SELECT
      "dimensionValue" AS value,
      SUM(clicks)::int AS clicks,
      SUM(impressions)::int AS impressions,
      CASE WHEN SUM(impressions) > 0 THEN SUM(clicks)::float / SUM(impressions) ELSE 0 END AS ctr,
      CASE WHEN SUM(impressions) > 0 THEN SUM(position * impressions) / SUM(impressions) ELSE 0 END AS position
    FROM gsc_dimension_daily
    WHERE "propertyId" = ${propertyId}
      AND "searchType" = ${searchType}
      AND dimension = ${dimension}
      AND date >= ${range.from}
      AND date <= ${range.to}
      ${searchClause}
    GROUP BY "dimensionValue"
    ORDER BY ${orderBy}, "dimensionValue" ASC
    LIMIT ${opts.pageSize} OFFSET ${offset}
  `);

  const totalRows = await prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
    SELECT COUNT(DISTINCT "dimensionValue")::int AS count
    FROM gsc_dimension_daily
    WHERE "propertyId" = ${propertyId}
      AND "searchType" = ${searchType}
      AND dimension = ${dimension}
      AND date >= ${range.from}
      AND date <= ${range.to}
      ${searchClause}
  `);

  return {
    rows: rows.map((r) => ({
      value: r.value,
      clicks: Number(r.clicks),
      impressions: Number(r.impressions),
      ctr: Number(r.ctr),
      position: Number(r.position),
    })),
    total: Number(totalRows[0]?.count ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Page indexing (from URL Inspection snapshots — labelled "derived" in the UI)
// ---------------------------------------------------------------------------

export interface IndexStatusResult {
  indexed: number;
  notIndexed: number;
  total: number;
  byCoverageState: { coverageState: string; count: number; indexed: boolean }[];
  lastInspectedAt: string | null;
}

const INDEXED_COVERAGE = new Set(["Submitted and indexed", "Indexed, not submitted in sitemap"]);

export async function getIndexStatus(propertyId: string): Promise<IndexStatusResult> {
  const [byVerdict, byState, latest] = await Promise.all([
    prisma.gscUrlIndexStatus.groupBy({ by: ["verdict"], where: { propertyId }, _count: { _all: true } }),
    prisma.gscUrlIndexStatus.groupBy({ by: ["coverageState"], where: { propertyId }, _count: { _all: true } }),
    prisma.gscUrlIndexStatus.findFirst({ where: { propertyId }, orderBy: { inspectedAt: "desc" }, select: { inspectedAt: true } }),
  ]);

  const indexed = byVerdict.filter((v) => v.verdict === "PASS").reduce((s, v) => s + v._count._all, 0);
  const total = byVerdict.reduce((s, v) => s + v._count._all, 0);

  return {
    indexed,
    notIndexed: total - indexed,
    total,
    byCoverageState: byState
      .map((s) => ({
        coverageState: s.coverageState ?? "Unknown",
        count: s._count._all,
        indexed: INDEXED_COVERAGE.has(s.coverageState ?? ""),
      }))
      .sort((a, b) => b.count - a.count),
    lastInspectedAt: latest?.inspectedAt ? latest.inspectedAt.toISOString() : null,
  };
}

export async function getCoverageUrls(
  propertyId: string,
  coverageState: string,
  opts: { page: number; pageSize: number }
): Promise<{ rows: { url: string; verdict: string | null; lastCrawlTime: string | null }[]; total: number }> {
  const where = { propertyId, coverageState };
  const [rows, total] = await Promise.all([
    prisma.gscUrlIndexStatus.findMany({
      where,
      orderBy: { url: "asc" },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
      select: { url: true, verdict: true, lastCrawlTime: true },
    }),
    prisma.gscUrlIndexStatus.count({ where }),
  ]);
  return {
    rows: rows.map((r) => ({ url: r.url, verdict: r.verdict, lastCrawlTime: r.lastCrawlTime?.toISOString() ?? null })),
    total,
  };
}

// ---------------------------------------------------------------------------
// Sitemaps / URL inspection / Core Web Vitals
// ---------------------------------------------------------------------------

export async function getSitemaps(propertyId: string) {
  return prisma.gscSitemap.findMany({ where: { propertyId }, orderBy: { path: "asc" } });
}

export async function getUrlInspection(propertyId: string, url: string) {
  return prisma.gscUrlIndexStatus.findFirst({ where: { propertyId, url } });
}

export interface CruxSummary {
  formFactor: string;
  buckets: { good: number; needsImprovement: number; poor: number };
  origin: { lcpP75: number | null; inpP75: number | null; clsP75: number | null; ttfbP75: number | null } | null;
  date: string | null;
}

export async function getCoreWebVitals(): Promise<{ formFactors: CruxSummary[]; source: "CrUX" }> {
  const rows = await prisma.cruxDaily.findMany({ orderBy: { date: "desc" }, take: 500 });
  const byFormFactor = new Map<string, typeof rows>();
  for (const row of rows) {
    const bucket = byFormFactor.get(row.formFactor);
    if (bucket) bucket.push(row);
    else byFormFactor.set(row.formFactor, [row]);
  }

  const formFactors: CruxSummary[] = ["phone", "desktop"].map((ff) => {
    const ffRows = byFormFactor.get(ff) ?? [];
    const latestDate = ffRows[0]?.date ? utcDateToYmd(ffRows[0].date) : null;
    const latestRows = ffRows.filter((r) => (r.date ? utcDateToYmd(r.date) : null) === latestDate);
    const urlRows = latestRows.filter((r) => r.scope === "url");
    const origin = latestRows.find((r) => r.scope === "origin") ?? null;
    return {
      formFactor: ff,
      buckets: {
        good: urlRows.filter((r) => r.bucket === "good").length,
        needsImprovement: urlRows.filter((r) => r.bucket === "needs_improvement").length,
        poor: urlRows.filter((r) => r.bucket === "poor").length,
      },
      origin: origin
        ? { lcpP75: origin.lcpP75, inpP75: origin.inpP75, clsP75: origin.clsP75, ttfbP75: origin.ttfbP75 }
        : null,
      date: latestDate,
    };
  });

  return { formFactors, source: "CrUX" };
}

// ---------------------------------------------------------------------------
// Sync status (GSC-specific, from gsc_sync_runs) — feeds the banner + Phase 5
// ---------------------------------------------------------------------------

export interface GscSyncStatusEntry {
  property: string;
  jobType: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  rowsWritten: number;
  errorCode: string | null;
  errorMessage: string | null;
}

export async function getGscSyncStatus(): Promise<GscSyncStatusEntry[]> {
  const runs = await prisma.gscSyncRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 100,
    include: { property: { select: { siteUrl: true } } },
  });
  const latest = new Map<string, (typeof runs)[number]>();
  for (const run of runs) {
    const key = `${run.propertyId}:${run.jobType}`;
    if (!latest.has(key)) latest.set(key, run);
  }
  return Array.from(latest.values()).map((run) => ({
    property: run.property.siteUrl,
    jobType: run.jobType,
    status: run.status,
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt?.toISOString() ?? null,
    rowsWritten: run.rowsWritten,
    errorCode: run.errorCode,
    errorMessage: run.errorMessage,
  }));
}
