import type { GscProperty } from "@prisma/client";
import { prisma } from "../../db/prisma-client";
import { logger } from "../../lib/logger";
import { addDays, addMonths, dayCountInclusive, pacificToday, ymdToUtcDate } from "../../lib/date/pacific";
import { searchAnalyticsAll, type SearchAnalyticsRow, type SearchAnalyticsType } from "./api";
import { classifyGscError, GscError, type GscErrorCode } from "./errors";
import {
  replaceDailyTotals,
  replaceDimensionRows,
  type DailyTotalInput,
  type DataState,
  type DimensionRowInput,
} from "./persistence";
import { getStoredProperties, syncProperties } from "./properties";

/**
 * The Search Console sync engine. Reads once from Google into the property-
 * scoped tables, then everything else reads Postgres. It uses combined
 * `[date, <dimension>]` pulls with startRow pagination — five dimension pulls
 * plus one totals pull per property/searchType/window — instead of one request
 * per day per dimension. Totals come from the `[date]`-only pull, never summed
 * from queries (anonymised queries make that undercount).
 */

export type SearchType = "web" | "image" | "video" | "news" | "discover";

// API dimension name -> the label we store in gsc_dimension_daily.
const DIMENSIONS: { api: string; stored: string }[] = [
  { api: "query", stored: "query" },
  { api: "page", stored: "page" },
  { api: "country", stored: "country" },
  { api: "device", stored: "device" },
  { api: "searchAppearance", stored: "search_appearance" },
];

const FATAL_CODES: GscErrorCode[] = ["AUTH_INVALID_KEY", "AUTH_NO_PERMISSION", "PROPERTY_NOT_FOUND", "CONFIG_MISSING"];

const DEFAULT_BACKFILL_MONTHS = 16;
const DEFAULT_WINDOW_DAYS = 90;
const DEFAULT_TRAILING_DAYS = 5;
const DEFAULT_THROTTLE_MS = 250;
const MAX_RETRY_ATTEMPTS = 5;

// Minimal structural logger type — both `logger` and `logger.child(...)` satisfy
// it, sidestepping pino's generic Logger<never>/<string> assignability quirk.
type Log = Pick<typeof logger, "info" | "warn" | "error" | "debug">;

interface RunWindow {
  startYmd: string;
  endYmd: string;
}

const num = (v: unknown): number => Number(v ?? 0);
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Split [start, end] into consecutive windows of at most `windowDays` days. */
function toWindows(startYmd: string, endYmd: string, windowDays: number): RunWindow[] {
  const out: RunWindow[] = [];
  let cursor = startYmd;
  while (cursor <= endYmd) {
    const winEnd = addDays(cursor, windowDays - 1);
    const clamped = winEnd < endYmd ? winEnd : endYmd;
    out.push({ startYmd: cursor, endYmd: clamped });
    cursor = addDays(clamped, 1);
  }
  return out;
}

/** Retry only classified-retryable errors (429 / network / 5xx) with exp backoff + jitter. */
async function withGscRetry<T>(fn: () => Promise<T>, log: Log): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      const info = error instanceof GscError ? error.info : classifyGscError(error);
      if (!info.retryable || attempt >= MAX_RETRY_ATTEMPTS) {
        throw error instanceof GscError ? error : new GscError(info);
      }
      const backoff = Math.min(30_000, 500 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 250);
      log.warn({ code: info.code, attempt, backoffMs: backoff }, "gsc retryable error; backing off");
      await sleep(backoff);
    }
  }
}

/**
 * A row is `provisional` only when it was fetched with dataState=all AND its
 * date is still inside the ~2-day revision lag. Everything else is `final`, so
 * as the daily window slides a day flips final once it settles (self-healing).
 */
function storedStateFor(apiDataState: "final" | "all", dateYmd: string, provisionalCutoffYmd: string): DataState {
  return apiDataState === "all" && dateYmd >= provisionalCutoffYmd ? "provisional" : "final";
}

async function fetchTotals(
  siteUrl: string,
  win: RunWindow,
  searchType: SearchType,
  dataState: "final" | "all",
  cutoffYmd: string
): Promise<DailyTotalInput[]> {
  const rows = await searchAnalyticsAll(siteUrl, {
    startDate: win.startYmd,
    endDate: win.endYmd,
    dimensions: ["date"],
    type: searchType as SearchAnalyticsType,
    dataState,
  });
  return rows
    .map((r: SearchAnalyticsRow) => {
      const date = r.keys?.[0] ?? "";
      return {
        date,
        clicks: num(r.clicks),
        impressions: num(r.impressions),
        ctr: num(r.ctr),
        position: num(r.position),
        dataState: storedStateFor(dataState, date, cutoffYmd),
      };
    })
    .filter((r) => r.date);
}

async function fetchDimension(
  siteUrl: string,
  win: RunWindow,
  searchType: SearchType,
  apiDimension: string,
  dataState: "final" | "all",
  cutoffYmd: string
): Promise<DimensionRowInput[]> {
  const rows = await searchAnalyticsAll(siteUrl, {
    startDate: win.startYmd,
    endDate: win.endYmd,
    dimensions: ["date", apiDimension],
    type: searchType as SearchAnalyticsType,
    dataState,
  });
  return rows
    .map((r: SearchAnalyticsRow) => {
      const date = r.keys?.[0] ?? "";
      return {
        date,
        value: r.keys?.[1] ?? "",
        clicks: num(r.clicks),
        impressions: num(r.impressions),
        ctr: num(r.ctr),
        position: num(r.position),
        dataState: storedStateFor(dataState, date, cutoffYmd),
      };
    })
    .filter((r) => r.date && r.value !== "");
}

interface SyncPropertyParams {
  property: GscProperty;
  searchTypes: SearchType[];
  startYmd: string;
  endYmd: string;
  windowDays: number;
  dataState: "final" | "all";
  jobType: "backfill" | "daily";
  throttleMs: number;
}

export interface SyncPropertyResult {
  siteUrl: string;
  rowsWritten: number;
  status: "success" | "partial" | "failed";
  failedSegments: string[];
  error?: string;
}

/** Sync one property, recording a gsc_sync_runs row with checkpoint + verdict. */
async function syncProperty(params: SyncPropertyParams): Promise<SyncPropertyResult> {
  const { property, searchTypes, startYmd, endYmd, windowDays, dataState, jobType, throttleMs } = params;
  const log = logger.child({ integration: "gsc", property: property.siteUrl, jobType });
  // Days on/after this are still-revising → stored provisional (when fetched with dataState=all).
  const provisionalCutoffYmd = addDays(pacificToday(), -2);
  const windows = toWindows(startYmd, endYmd, windowDays);

  const run = await prisma.gscSyncRun.create({
    data: {
      propertyId: property.id,
      jobType,
      status: "running",
      dateRangeStart: ymdToUtcDate(startYmd),
      dateRangeEnd: ymdToUtcDate(endYmd),
    },
  });

  let rowsWritten = 0;
  const failedSegments: string[] = [];

  const segment = async (label: string, run2: () => Promise<number>): Promise<void> => {
    try {
      rowsWritten += await withGscRetry(run2, log);
      if (throttleMs) await sleep(throttleMs);
    } catch (error) {
      const info = error instanceof GscError ? error.info : classifyGscError(error);
      if (FATAL_CODES.includes(info.code)) throw error instanceof GscError ? error : new GscError(info);
      log.error({ code: info.code, label }, "gsc segment failed; continuing (partial)");
      failedSegments.push(label);
    }
  };

  try {
    for (const searchType of searchTypes) {
      for (const win of windows) {
        await segment(`totals/${searchType}/${win.startYmd}`, async () =>
          replaceDailyTotals(
            property.id,
            searchType,
            win.startYmd,
            win.endYmd,
            await fetchTotals(property.siteUrl, win, searchType, dataState, provisionalCutoffYmd)
          )
        );
        for (const dim of DIMENSIONS) {
          await segment(`${dim.stored}/${searchType}/${win.startYmd}`, async () =>
            replaceDimensionRows(
              property.id,
              searchType,
              dim.stored,
              win.startYmd,
              win.endYmd,
              await fetchDimension(property.siteUrl, win, searchType, dim.api, dataState, provisionalCutoffYmd)
            )
          );
        }
        await prisma.gscSyncRun.update({
          where: { id: run.id },
          data: { rowsWritten, cursor: { searchType, windowEnd: win.endYmd } },
        });
      }
    }

    const status = failedSegments.length > 0 ? "partial" : "success";
    await prisma.gscSyncRun.update({
      where: { id: run.id },
      data: {
        status,
        finishedAt: new Date(),
        rowsWritten,
        errorMessage: failedSegments.length > 0 ? `failed segments: ${failedSegments.join(", ")}` : null,
      },
    });
    log.info({ status, rowsWritten, failedSegments: failedSegments.length }, "gsc property sync finished");
    return { siteUrl: property.siteUrl, rowsWritten, status, failedSegments };
  } catch (error) {
    const info = error instanceof GscError ? error.info : classifyGscError(error);
    await prisma.gscSyncRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        rowsWritten,
        errorCode: info.code,
        errorMessage: `${info.reason} — ${info.remedy}`,
      },
    });
    log.error({ code: info.code }, "gsc property sync failed");
    return { siteUrl: property.siteUrl, rowsWritten, status: "failed", failedSegments, error: `${info.code}: ${info.reason}` };
  }
}

async function selectProperties(siteUrls?: string[]): Promise<GscProperty[]> {
  const stored = await getStoredProperties();
  if (!siteUrls || siteUrls.length === 0) return stored;
  const bySite = new Map(stored.map((p) => [p.siteUrl, p]));
  return siteUrls.map((s) => {
    const found = bySite.get(s);
    if (!found) throw new Error(`Property "${s}" is not visible to the service account (run gsc:doctor).`);
    return found;
  });
}

export interface SyncSummary {
  startYmd: string;
  endYmd: string;
  results: SyncPropertyResult[];
}

export interface RunSyncOptions {
  startYmd: string;
  endYmd: string;
  dataState: "final" | "all";
  jobType: "backfill" | "daily";
  windowDays: number;
  properties?: string[];
  searchTypes?: SearchType[];
  throttleMs?: number;
  /** Skip the sites.list registry refresh (e.g. when the caller already did it). */
  skipPropertySync?: boolean;
}

/**
 * The single sync path: refresh the property registry, then sync each property
 * over [startYmd, endYmd]. Backfill, the daily job, and the scheduler adapter
 * all funnel through here so bookkeeping and error handling are identical.
 */
export async function runSync(opts: RunSyncOptions): Promise<SyncSummary> {
  if (!opts.skipPropertySync) await syncProperties();
  const properties = await selectProperties(opts.properties);
  const searchTypes = opts.searchTypes ?? ["web"];

  const results: SyncPropertyResult[] = [];
  for (const property of properties) {
    results.push(
      await syncProperty({
        property,
        searchTypes,
        startYmd: opts.startYmd,
        endYmd: opts.endYmd,
        windowDays: opts.windowDays,
        dataState: opts.dataState,
        jobType: opts.jobType,
        throttleMs: opts.throttleMs ?? DEFAULT_THROTTLE_MS,
      })
    );
  }
  return { startYmd: opts.startYmd, endYmd: opts.endYmd, results };
}

export interface BackfillOptions {
  months?: number;
  windowDays?: number;
  properties?: string[];
  searchTypes?: SearchType[];
  throttleMs?: number;
}

/** One-time historical backfill (default 16 months, finalised data). */
export async function runBackfill(opts: BackfillOptions = {}): Promise<SyncSummary> {
  const endYmd = pacificToday();
  return runSync({
    startYmd: addMonths(endYmd, -(opts.months ?? DEFAULT_BACKFILL_MONTHS)),
    endYmd,
    dataState: "final",
    jobType: "backfill",
    windowDays: opts.windowDays ?? DEFAULT_WINDOW_DAYS,
    properties: opts.properties,
    searchTypes: opts.searchTypes,
    throttleMs: opts.throttleMs,
  });
}

export interface DailyOptions {
  trailingDays?: number;
  properties?: string[];
  searchTypes?: SearchType[];
  throttleMs?: number;
}

/**
 * Scheduled incremental sync: re-fetch the trailing window (default 5 days) with
 * dataState=all so the freshest numbers land, stored as `provisional` so
 * revision drift is never mistaken for a sync bug.
 */
export async function runDaily(opts: DailyOptions = {}): Promise<SyncSummary> {
  const endYmd = pacificToday();
  return runSync({
    startYmd: addDays(endYmd, -((opts.trailingDays ?? DEFAULT_TRAILING_DAYS) - 1)),
    endYmd,
    dataState: "all",
    jobType: "daily",
    windowDays: 400, // one window — the trailing range is tiny
    properties: opts.properties,
    searchTypes: opts.searchTypes,
    throttleMs: opts.throttleMs,
  });
}

/** Total rows written across a summary — used by the scheduler adapter. */
export function totalRowsWritten(summary: SyncSummary): number {
  return summary.results.reduce((sum, r) => sum + r.rowsWritten, 0);
}

// ---------------------------------------------------------------------------
// Quota pre-flight estimate (pure — no Google calls). Correction A: show the
// call count / wall-clock / quota headroom BEFORE spending anything.
// ---------------------------------------------------------------------------

export interface EstimateInput {
  properties: number;
  searchTypes?: number;
  months?: number;
  windowDays?: number;
  throttleMs?: number;
  /** typical / worst-case pages per paginated pull (row-count dependent). */
  avgPagesPerPull?: number;
  maxPagesPerPull?: number;
}

export interface BackfillEstimate {
  properties: number;
  searchTypes: number;
  months: number;
  windowDays: number;
  windowsPerProperty: number;
  pullsPerWindow: number;
  logicalPulls: number;
  requestsMin: number;
  requestsTypical: number;
  requestsMax: number;
  wallClockSecTypical: number;
  wallClockSecMax: number;
  throttleMs: number;
  softQpmPerProperty: number;
  peakQpmUsagePct: number;
}

const PULLS_PER_WINDOW = 1 + DIMENSIONS.length; // 1 totals + 5 dimensions
const APPROX_REQUEST_LATENCY_MS = 400;
const SOFT_QPM_PER_PROPERTY = 1200;

export function estimateBackfill(input: EstimateInput): BackfillEstimate {
  const searchTypes = input.searchTypes ?? 1;
  const months = input.months ?? DEFAULT_BACKFILL_MONTHS;
  const windowDays = input.windowDays ?? DEFAULT_WINDOW_DAYS;
  const throttleMs = input.throttleMs ?? DEFAULT_THROTTLE_MS;
  const avgPages = input.avgPagesPerPull ?? 2;
  const maxPages = input.maxPagesPerPull ?? 8;

  const days = dayCountInclusive("2000-01-01", addMonths("2000-01-01", months)); // days in `months`
  const windowsPerProperty = Math.ceil(days / windowDays);
  const logicalPulls = input.properties * searchTypes * windowsPerProperty * PULLS_PER_WINDOW;

  const requestsMin = logicalPulls * 1;
  const requestsTypical = logicalPulls * avgPages;
  const requestsMax = logicalPulls * maxPages;

  const perRequestSec = (throttleMs + APPROX_REQUEST_LATENCY_MS) / 1000;
  // Requests are serialised per property; properties run one after another too.
  const wallClockSecTypical = Math.round(requestsTypical * perRequestSec);
  const wallClockSecMax = Math.round(requestsMax * perRequestSec);

  // Peak QPM against ONE property (requests are serial, so peak/min ≈ 60/perRequestSec).
  const peakQpm = Math.round(60 / perRequestSec);
  const peakQpmUsagePct = Math.round((peakQpm / SOFT_QPM_PER_PROPERTY) * 100);

  return {
    properties: input.properties,
    searchTypes,
    months,
    windowDays,
    windowsPerProperty,
    pullsPerWindow: PULLS_PER_WINDOW,
    logicalPulls,
    requestsMin,
    requestsTypical,
    requestsMax,
    wallClockSecTypical,
    wallClockSecMax,
    throttleMs,
    softQpmPerProperty: SOFT_QPM_PER_PROPERTY,
    peakQpmUsagePct,
  };
}
