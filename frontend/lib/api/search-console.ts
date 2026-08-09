import { apiGet, apiPost } from "./client";

/**
 * Typed client for the Search Console section API (backend /search-console/*).
 * Every read comes from our DB; nothing here calls Google directly.
 */

export type GscSearchType = "web" | "image" | "video" | "news" | "discover";
export type GscDimension = "query" | "page" | "country" | "device" | "search_appearance";
export type Granularity = "daily" | "weekly" | "monthly";
export type CompareMode = "none" | "previous_period" | "previous_year";

export interface GscPropertyDto {
  siteUrl: string;
  displayName: string;
  type: "domain" | "url_prefix";
  isDefault: boolean;
  permissionLevel: string | null;
}

export interface MetricSummary {
  value: number;
  deltaPct: number | null;
}

export interface SummaryResult {
  clicks: MetricSummary;
  impressions: MetricSummary;
  ctr: MetricSummary;
  position: MetricSummary;
  provisional: boolean;
}

export interface GscSeriesPoint {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscDimensionRow {
  value: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface IndexStatusResult {
  indexed: number;
  notIndexed: number;
  total: number;
  byCoverageState: { coverageState: string; count: number; indexed: boolean }[];
  lastInspectedAt: string | null;
  source: string;
}

export interface CoverageUrlRow {
  url: string;
  verdict: string | null;
  lastCrawlTime: string | null;
}

export interface SitemapDto {
  id: string;
  path: string;
  lastSubmitted: string | null;
  lastDownloaded: string | null;
  isPending: boolean;
  isSitemapsIndex: boolean;
  type: string | null;
  warnings: number;
  errors: number;
  submittedUrls: number;
  indexedUrls: number;
}

export interface UrlInspectionDto {
  url: string;
  verdict: string | null;
  coverageState: string | null;
  robotsTxtState: string | null;
  indexingState: string | null;
  pageFetchState: string | null;
  googleCanonical: string | null;
  userCanonical: string | null;
  lastCrawlTime: string | null;
  crawledAs: string | null;
  isHttps: boolean | null;
  inspectedAt: string;
}

export interface CruxSummary {
  formFactor: string;
  buckets: { good: number; needsImprovement: number; poor: number };
  origin: { lcpP75: number | null; inpP75: number | null; clsP75: number | null; ttfbP75: number | null } | null;
  date: string | null;
}

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

type Envelope<T> = { data: T; meta?: Record<string, unknown> };

/** Query params shared by summary/timeseries/dimension requests. */
export interface GscQueryParams {
  property?: string;
  searchType?: GscSearchType;
  days?: number;
  from?: string;
  to?: string;
  compare?: CompareMode;
}

function baseParams(p: GscQueryParams): Record<string, string | number | undefined> {
  return {
    property: p.property,
    searchType: p.searchType,
    days: p.days,
    from: p.from,
    to: p.to,
    compare: p.compare,
  };
}

export function getGscProperties(): Promise<GscPropertyDto[]> {
  return apiGet<Envelope<GscPropertyDto[]>>("/search-console/properties").then((r) => r.data ?? []);
}

export function getGscSummary(p: GscQueryParams): Promise<{ summary: SummaryResult | null; properties: GscPropertyDto[]; property: string | null }> {
  return apiGet<Envelope<SummaryResult | null>>("/search-console/summary", baseParams(p)).then((r) => ({
    summary: r.data,
    properties: (r.meta?.properties as GscPropertyDto[]) ?? [],
    property: (r.meta?.property as string | null) ?? null,
  }));
}

export function getGscTimeseries(
  p: GscQueryParams & { granularity?: Granularity }
): Promise<{ current: GscSeriesPoint[]; previous: GscSeriesPoint[] }> {
  return apiGet<Envelope<{ current: GscSeriesPoint[]; previous: GscSeriesPoint[] }>>("/search-console/timeseries", {
    ...baseParams(p),
    granularity: p.granularity,
  }).then((r) => r.data ?? { current: [], previous: [] });
}

export function getGscDimension(
  dimension: GscDimension,
  p: GscQueryParams & { page?: number; pageSize?: number; sort?: string; search?: string }
): Promise<{ rows: GscDimensionRow[]; total: number; page: number; pageSize: number }> {
  return apiGet<Envelope<GscDimensionRow[]>>(`/search-console/dimension/${dimension}`, {
    ...baseParams(p),
    page: p.page,
    pageSize: p.pageSize,
    sort: p.sort,
    search: p.search,
  }).then((r) => ({
    rows: r.data ?? [],
    total: Number(r.meta?.total ?? 0),
    page: Number(r.meta?.page ?? 1),
    pageSize: Number(r.meta?.pageSize ?? 10),
  }));
}

export function getGscIndexStatus(property?: string): Promise<IndexStatusResult | null> {
  return apiGet<Envelope<IndexStatusResult | null>>("/search-console/pages/index-status", { property }).then((r) => r.data);
}

export function getGscCoverageUrls(
  property: string | undefined,
  coverageState: string,
  page = 1,
  pageSize = 25
): Promise<{ rows: CoverageUrlRow[]; total: number }> {
  return apiGet<Envelope<CoverageUrlRow[]>>("/search-console/pages/coverage", {
    property,
    coverageState,
    page,
    pageSize,
  }).then((r) => ({ rows: r.data ?? [], total: Number(r.meta?.total ?? 0) }));
}

export function getGscSitemaps(property?: string): Promise<SitemapDto[]> {
  return apiGet<Envelope<SitemapDto[]>>("/search-console/sitemaps", { property }).then((r) => r.data ?? []);
}

export function getGscUrlInspection(property: string | undefined, url: string): Promise<UrlInspectionDto | null> {
  return apiGet<Envelope<UrlInspectionDto | null>>("/search-console/url-inspection", { property, url }).then((r) => r.data);
}

export function getGscCoreWebVitals(): Promise<{ formFactors: CruxSummary[]; source: string }> {
  return apiGet<Envelope<{ formFactors: CruxSummary[]; source: string }>>("/search-console/core-web-vitals").then(
    (r) => r.data ?? { formFactors: [], source: "CrUX" }
  );
}

export function getGscSyncStatus(): Promise<GscSyncStatusEntry[]> {
  return apiGet<Envelope<GscSyncStatusEntry[]>>("/search-console/sync-status").then((r) => r.data ?? []);
}

export function triggerGscSync(body: { property?: string; mode?: "daily" | "backfill" }): Promise<{ data: unknown }> {
  return apiPost<{ data: unknown }>("/search-console/sync", body);
}
