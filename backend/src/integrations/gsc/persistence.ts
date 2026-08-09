import { createHash } from "crypto";
import { prisma } from "../../db/prisma-client";
import { ymdToUtcDate } from "../../lib/date/pacific";

/**
 * Writes into the property-scoped GSC tables. Every write is a range REPLACE
 * (delete the window, then bulk insert) so re-running any sync — the trailing
 * daily window, a re-backfill — is idempotent and also clears rows for dates
 * that no longer return data. Inserts are chunked to stay under Postgres'
 * 65535 bind-parameter limit.
 */

export type DataState = "final" | "provisional";

export interface DailyTotalInput {
  date: string; // YYYY-MM-DD (PT)
  clicks: number;
  impressions: number;
  ctr: number; // fraction 0..1
  position: number;
  dataState: DataState; // per-row: provisional only for fresh, still-revising days
}

export interface DimensionRowInput {
  date: string; // YYYY-MM-DD (PT)
  value: string; // dimension value (query text, page URL, country, …)
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  dataState: DataState;
}

export function md5(value: string): string {
  return createHash("md5").update(value).digest("hex");
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// Row widths: daily total = 8 cols, dimension = 11 cols. Keep chunks well under
// 65535 / cols so a single INSERT never exceeds the bind-parameter ceiling.
const DAILY_CHUNK = 5000;
const DIMENSION_CHUNK = 4000;

/** Replace daily totals for [startYmd, endYmd] for one property + search type. */
export async function replaceDailyTotals(
  propertyId: string,
  searchType: string,
  startYmd: string,
  endYmd: string,
  rows: DailyTotalInput[]
): Promise<number> {
  await prisma.gscDailyTotal.deleteMany({
    where: { propertyId, searchType, date: { gte: ymdToUtcDate(startYmd), lte: ymdToUtcDate(endYmd) } },
  });
  for (const batch of chunk(rows, DAILY_CHUNK)) {
    await prisma.gscDailyTotal.createMany({
      data: batch.map((r) => ({
        propertyId,
        searchType,
        date: ymdToUtcDate(r.date),
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
        dataState: r.dataState,
      })),
    });
  }
  return rows.length;
}

/** Replace one dimension's rows for [startYmd, endYmd] for one property + search type. */
export async function replaceDimensionRows(
  propertyId: string,
  searchType: string,
  dimension: string,
  startYmd: string,
  endYmd: string,
  rows: DimensionRowInput[]
): Promise<number> {
  await prisma.gscDimensionDaily.deleteMany({
    where: { propertyId, searchType, dimension, date: { gte: ymdToUtcDate(startYmd), lte: ymdToUtcDate(endYmd) } },
  });
  for (const batch of chunk(rows, DIMENSION_CHUNK)) {
    await prisma.gscDimensionDaily.createMany({
      data: batch.map((r) => ({
        propertyId,
        searchType,
        dimension,
        date: ymdToUtcDate(r.date),
        dimensionValue: r.value,
        dimensionValueHash: md5(r.value),
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
        dataState: r.dataState,
      })),
    });
  }
  return rows.length;
}
