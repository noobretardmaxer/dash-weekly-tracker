export type TimeSeriesPoint = { date: string; value: number };

/** Ports the same semantics as lib/mock-data/utils.ts so KPI math stays consistent with the original frontend demo. */
export function sliceLastNDays(series: TimeSeriesPoint[], days: number): TimeSeriesPoint[] {
  return series.slice(-days);
}

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

/** Week-over-week growth: last 7 days vs the preceding 7 days. */
export function weekOverWeek(series: TimeSeriesPoint[], aggregate: "sum" | "average" = "sum"): number {
  const agg = aggregate === "sum" ? sumSeries : averageSeries;
  return computeDeltaPct(agg(sliceLastNDays(series, 7)), agg(getPreviousPeriod(series, 7)));
}

/** Month-over-month growth: last 30 days vs the preceding 30 days. */
export function monthOverMonth(series: TimeSeriesPoint[], aggregate: "sum" | "average" = "sum"): number {
  const agg = aggregate === "sum" ? sumSeries : averageSeries;
  return computeDeltaPct(agg(sliceLastNDays(series, 30)), agg(getPreviousPeriod(series, 30)));
}

export function rollingAverage(series: TimeSeriesPoint[], windowDays: number): TimeSeriesPoint[] {
  return series.map((point, i) => {
    const window = series.slice(Math.max(0, i - windowDays + 1), i + 1);
    return { date: point.date, value: averageSeries(window) };
  });
}

export const movingAverage = rollingAverage;

export type KpiFormat = "number" | "compact" | "percent" | "position" | "duration";

export type KpiMetric = {
  id: string;
  label: string;
  value: number;
  format: KpiFormat;
  deltaPct: number;
  positiveIsGood: boolean;
  series: TimeSeriesPoint[];
};

/** Builds a KpiMetric from a current + previous window, matching the semantics of the
 * frontend's original lib/mock-data/utils.ts buildKpiMetric, now computed server-side. */
export function buildKpiMetric({
  id,
  label,
  format,
  current,
  previous,
  sparklineDays = 14,
  aggregate = "sum",
  positiveIsGood = true,
}: {
  id: string;
  label: string;
  format: KpiFormat;
  current: TimeSeriesPoint[];
  previous: TimeSeriesPoint[];
  sparklineDays?: number;
  aggregate?: "sum" | "average" | "last";
  positiveIsGood?: boolean;
}): KpiMetric {
  const aggregateFn = (points: TimeSeriesPoint[]) =>
    aggregate === "sum" ? sumSeries(points) : aggregate === "average" ? averageSeries(points) : (points[points.length - 1]?.value ?? 0);

  const value = aggregateFn(current);
  const prevValue = aggregateFn(previous);

  return {
    id,
    label,
    value,
    format,
    deltaPct: computeDeltaPct(value, prevValue),
    positiveIsGood,
    series: sliceLastNDays(current, sparklineDays),
  };
}

/** Value at the given percentile of the series, and its % difference from the latest value. */
export function percentileChange(series: TimeSeriesPoint[], percentile: number): { percentileValue: number; deltaPct: number } {
  if (!series.length) return { percentileValue: 0, deltaPct: 0 };
  const sorted = [...series].map((p) => p.value).sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((percentile / 100) * sorted.length));
  const percentileValue = sorted[index];
  const latest = series[series.length - 1].value;
  return { percentileValue, deltaPct: computeDeltaPct(latest, percentileValue) };
}
