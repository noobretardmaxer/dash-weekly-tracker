import { faker } from "@faker-js/faker";
import { MASTER_SERIES_DAYS } from "./seed";
import type { TimeSeriesPoint, KpiMetric, KpiFormat } from "./types";

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** `count` consecutive daily dates ending today (inclusive), oldest first. */
export function buildDateSpine(count: number, endDate: Date = new Date()): Date[] {
  const dates: Date[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    dates.push(d);
  }
  return dates;
}

export type GenerateTimeSeriesOptions = {
  days?: number;
  baseValue: number;
  /** Fraction of baseValue used as daily random noise, e.g. 0.12 = +/-12%. */
  volatility?: number;
  /** Overall % change in the trendline from the first day to the last. */
  trendPct?: number;
  minValue?: number;
  round?: boolean;
  /** Multiply weekend days by this factor (1 = no effect). */
  weekendFactor?: number;
};

/** Generates a daily time series with a linear trend, weekly seasonality, and seeded random noise. */
export function generateTimeSeries({
  days = MASTER_SERIES_DAYS,
  baseValue,
  volatility = 0.12,
  trendPct = 10,
  minValue = 0,
  round = true,
  weekendFactor = 1,
}: GenerateTimeSeriesOptions): TimeSeriesPoint[] {
  const dates = buildDateSpine(days);
  const trendMultiplierEnd = 1 + trendPct / 100;

  return dates.map((date, i) => {
    const progress = days <= 1 ? 1 : i / (days - 1);
    const trendValue = baseValue * (1 + (trendMultiplierEnd - 1) * progress);
    const noise = 1 + faker.number.float({ min: -volatility, max: volatility, fractionDigits: 3 });
    const dow = date.getDay();
    const weekendMultiplier = dow === 0 || dow === 6 ? weekendFactor : 1;
    const value = Math.max(minValue, trendValue * noise * weekendMultiplier);
    return { date: toIsoDate(date), value: round ? Math.round(value) : Number(value.toFixed(2)) };
  });
}

export function sliceLastNDays(series: TimeSeriesPoint[], days: number): TimeSeriesPoint[] {
  return series.slice(-days);
}

/** The equal-length window immediately preceding the last `days` days — used for "compare previous period." */
export function getPreviousPeriod(series: TimeSeriesPoint[], days: number): TimeSeriesPoint[] {
  return series.slice(-days * 2, -days);
}

export function sumSeries(series: TimeSeriesPoint[]): number {
  return series.reduce((acc, p) => acc + p.value, 0);
}

export function averageSeries(series: TimeSeriesPoint[]): number {
  if (!series.length) return 0;
  return sumSeries(series) / series.length;
}

export function computeDeltaPct(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export function buildKpiMetric({
  id,
  label,
  format,
  fullSeries,
  rangeDays = 30,
  sparklineDays = 14,
  aggregate = "sum",
  positiveIsGood = true,
}: {
  id: string;
  label: string;
  format: KpiFormat;
  fullSeries: TimeSeriesPoint[];
  rangeDays?: number;
  sparklineDays?: number;
  aggregate?: "sum" | "average" | "last";
  positiveIsGood?: boolean;
}): KpiMetric {
  const current = sliceLastNDays(fullSeries, rangeDays);
  const previous = getPreviousPeriod(fullSeries, rangeDays);

  const aggregateFn = (points: TimeSeriesPoint[]) =>
    aggregate === "sum"
      ? sumSeries(points)
      : aggregate === "average"
        ? averageSeries(points)
        : (points[points.length - 1]?.value ?? 0);

  const value = aggregateFn(current);
  const prevValue = aggregateFn(previous);

  return {
    id,
    label,
    value,
    format,
    deltaPct: computeDeltaPct(value, prevValue),
    positiveIsGood,
    series: sliceLastNDays(fullSeries, sparklineDays),
  };
}
