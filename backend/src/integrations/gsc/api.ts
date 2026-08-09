import { createHttpClient } from "../shared/http-client";
import { getAccessToken } from "./auth";
import { classifyGscError, GscError } from "./errors";

/**
 * Thin, typed wrappers over the Search Console API v3 REST endpoints, sharing
 * one authenticated http client. Every call attaches a fresh bearer token and
 * re-throws failures as classified {@link GscError}s. Used by both the sync
 * client (client.ts) and the diagnostic tool (scripts/gsc-doctor.ts).
 *
 * Docs: https://developers.google.com/webmaster-tools/v1/searchanalytics/query
 */

const http = createHttpClient("https://www.googleapis.com");

export interface SiteEntry {
  siteUrl: string;
  permissionLevel: string;
}

export interface SearchAnalyticsRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

export type SearchAnalyticsType = "web" | "image" | "video" | "news" | "discover" | "googleNews";

export interface SearchAnalyticsBody {
  startDate: string;
  endDate: string;
  dimensions?: string[];
  rowLimit?: number;
  startRow?: number;
  type?: SearchAnalyticsType;
  /**
   * `final` = only settled data; `all` = include fresh-but-provisional rows for
   * the trailing lag window. See docs/integrations/google-search-console.md.
   */
  dataState?: "all" | "final";
  dimensionFilterGroups?: unknown[];
}

/** Properties (and permission levels) this service account can see. */
export async function listSites(): Promise<SiteEntry[]> {
  const token = await getAccessToken();
  try {
    const { data } = await http.get<{ siteEntry?: SiteEntry[] }>("/webmasters/v3/sites", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data.siteEntry ?? [];
  } catch (e) {
    throw new GscError(classifyGscError(e));
  }
}

/**
 * One `searchanalytics.query` page. `siteUrl` is URL-encoded here, which turns
 * `sc-domain:hydradb.com` into `sc-domain%3Ahydradb.com` (getting this wrong
 * yields a confusing 403).
 */
export async function searchAnalyticsQuery(siteUrl: string, body: SearchAnalyticsBody): Promise<SearchAnalyticsRow[]> {
  const token = await getAccessToken();
  const encoded = encodeURIComponent(siteUrl);
  try {
    const { data } = await http.post<{ rows?: SearchAnalyticsRow[] }>(
      `/webmasters/v3/sites/${encoded}/searchAnalytics/query`,
      body,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data.rows ?? [];
  } catch (e) {
    throw new GscError(classifyGscError(e));
  }
}

/** The API's hard row cap per request. */
export const MAX_ROW_LIMIT = 25000;

export interface PaginateOptions {
  /** Rows per page (defaults to the API max). */
  rowLimit?: number;
  /** Defensive cap so a runaway query can't loop forever. */
  maxPages?: number;
  /** Called after each page; use to throttle and to report progress. */
  onPage?: (page: number, rowsSoFar: number) => void | Promise<void>;
}

/**
 * Fetch every row for a query by walking `startRow` until a page returns fewer
 * than `rowLimit` (or the defensive page cap trips). This is how a single
 * logical `[date, query]` pull can cover 16 months in a handful of requests
 * instead of one request per day.
 */
export async function searchAnalyticsAll(
  siteUrl: string,
  body: SearchAnalyticsBody,
  options: PaginateOptions = {}
): Promise<SearchAnalyticsRow[]> {
  const rowLimit = options.rowLimit ?? MAX_ROW_LIMIT;
  const maxPages = options.maxPages ?? 200;
  const all: SearchAnalyticsRow[] = [];
  for (let page = 0; page < maxPages; page += 1) {
    const rows = await searchAnalyticsQuery(siteUrl, { ...body, rowLimit, startRow: page * rowLimit });
    all.push(...rows);
    if (options.onPage) await options.onPage(page + 1, all.length);
    if (rows.length < rowLimit) return all;
  }
  return all;
}
