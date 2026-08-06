import type { TimeSeriesPoint, ShareSlice, FunnelStep } from "@/lib/mock-data/types";
import type { BarDatum } from "@/components/charts/bar-chart";

type PostHogSeries = {
  label?: string;
  labels?: string[];
  data?: number[];
  count?: number;
  aggregated_value?: number;
  breakdown_value?: string | number;
  compare_label?: string;
  status?: string;
  custom_name?: string;
  action?: { custom_name?: string; name?: string };
};

// ---------------------------------------------------------------------------
// BoldNumber
// ---------------------------------------------------------------------------

export type BoldNumberResult = {
  value: number;
  previousValue?: number;
  deltaPct?: number;
};

export function parseBoldNumber(result: unknown): BoldNumberResult {
  if (!Array.isArray(result)) {
    // HogQL DataVisualizationNode: result is { results: [[value]], columns, types }
    const r = result as { results?: unknown[][] };
    if (r.results?.[0]?.[0] != null) {
      return { value: Number(r.results[0][0]) };
    }
    return { value: 0 };
  }

  const series = result as PostHogSeries[];
  const current = series.find((s) => s.compare_label === "current") ?? series[0];
  const previous = series.find((s) => s.compare_label === "previous");

  const curVal = current?.aggregated_value ?? current?.count ?? sumData(current) ?? 0;
  const prevVal = previous
    ? (previous.aggregated_value ?? previous.count ?? sumData(previous) ?? 0)
    : undefined;

  const deltaPct =
    prevVal != null && prevVal !== 0
      ? Math.round(((curVal - prevVal) / prevVal) * 10000) / 100
      : undefined;

  return { value: curVal, previousValue: prevVal, deltaPct };
}

function sumData(s?: PostHogSeries): number | undefined {
  if (!s?.data) return undefined;
  return s.data.reduce((a, b) => a + b, 0);
}

// ---------------------------------------------------------------------------
// Time Series (line / area charts)
// ---------------------------------------------------------------------------

export type MultiTimeSeries = {
  series: { key: string; label: string; data: TimeSeriesPoint[] }[];
};

export function parseTimeSeries(result: unknown): MultiTimeSeries {
  if (!Array.isArray(result)) return { series: [] };
  const raw = result as PostHogSeries[];
  const series = raw
    .filter((s) => s.compare_label !== "previous")
    .map((s, i) => ({
      key: `s${i}`,
      label: s.custom_name ?? s.action?.custom_name ?? s.label ?? `Series ${i + 1}`,
      data: toTimeSeries(s),
    }));
  return { series };
}

function toTimeSeries(s: PostHogSeries): TimeSeriesPoint[] {
  if (!s.labels || !s.data) return [];
  return s.labels.map((label, i) => ({
    date: label.slice(0, 10),
    value: s.data![i] ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Pie / Donut
// ---------------------------------------------------------------------------

export function parsePieData(result: unknown): ShareSlice[] {
  if (!Array.isArray(result)) return [];
  return (result as PostHogSeries[]).map((s) => ({
    name: String(s.label ?? s.breakdown_value ?? "Unknown"),
    value: s.aggregated_value ?? s.count ?? sumData(s) ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Bar chart
// ---------------------------------------------------------------------------

export function parseBarData(result: unknown): BarDatum[] {
  if (!Array.isArray(result)) return [];
  return (result as PostHogSeries[])
    .map((s) => ({
      name: String(s.label ?? s.breakdown_value ?? "Unknown"),
      value: s.aggregated_value ?? s.count ?? sumData(s) ?? 0,
    }))
    .sort((a, b) => b.value - a.value);
}

// ---------------------------------------------------------------------------
// Funnel
// ---------------------------------------------------------------------------

type PostHogFunnelStep = {
  name?: string;
  custom_name?: string;
  action_id?: string;
  count?: number;
  order?: number;
  conversion_rate?: number;
  average_conversion_time?: number | null;
};

export function parseFunnelData(result: unknown): FunnelStep[] {
  if (!Array.isArray(result)) return [];
  // PostHog funnel results can be nested: [[step1, step2, ...]] or flat
  const steps = (Array.isArray(result[0]) ? result[0] : result) as PostHogFunnelStep[];
  return steps.map((s) => ({
    name: s.custom_name ?? s.name ?? `Step ${(s.order ?? 0) + 1}`,
    value: s.count ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Lifecycle (stacked bar)
// ---------------------------------------------------------------------------

export type LifecycleData = {
  dates: string[];
  series: { key: string; label: string; color: string }[];
  data: Record<string, string | number>[];
};

const LIFECYCLE_COLORS: Record<string, string> = {
  new: "var(--chart-1)",
  returning: "var(--chart-2)",
  resurrecting: "var(--chart-3)",
  dormant: "var(--chart-4)",
};

export function parseLifecycleData(result: unknown): LifecycleData {
  if (!Array.isArray(result)) return { dates: [], series: [], data: [] };
  const raw = result as PostHogSeries[];

  const dateSet = new Set<string>();
  for (const s of raw) {
    for (const l of s.labels ?? []) dateSet.add(l.slice(0, 10));
  }
  const dates = Array.from(dateSet).sort();

  const series = raw.map((s) => ({
    key: s.status ?? s.label ?? "unknown",
    label: capitalize(s.status ?? s.label ?? "unknown"),
    color: LIFECYCLE_COLORS[s.status ?? ""] ?? "var(--chart-5)",
  }));

  const data = dates.map((date) => {
    const point: Record<string, string | number> = { date };
    for (const s of raw) {
      const key = s.status ?? s.label ?? "unknown";
      const idx = (s.labels ?? []).findIndex((l) => l.slice(0, 10) === date);
      point[key] = idx >= 0 ? (s.data?.[idx] ?? 0) : 0;
    }
    return point;
  });

  return { dates, series, data };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Table (ActionsTable breakdowns or HogQL results)
// ---------------------------------------------------------------------------

export type TableResult = {
  columns: { key: string; label: string }[];
  rows: Record<string, unknown>[];
};

export function parseTrendsTable(result: unknown): TableResult {
  if (!Array.isArray(result)) return parseHogQLTable(result);

  const series = result as PostHogSeries[];
  if (series.length === 0) return { columns: [], rows: [] };

  // For breakdown trends displayed as table: each series is a breakdown value
  // with aggregated count. Build a single-row-per-series table.
  const columns = [
    { key: "name", label: series[0]?.action?.name ?? "Breakdown" },
    { key: "value", label: "Count" },
  ];

  const rows = series.map((s) => ({
    name: String(s.label ?? s.breakdown_value ?? ""),
    value: s.aggregated_value ?? s.count ?? sumData(s) ?? 0,
  }));

  return { columns, rows };
}

export function parseHogQLTable(result: unknown): TableResult {
  const r = result as { results?: unknown[][]; columns?: string[]; types?: string[] } | null;
  if (!r?.columns || !r?.results) return { columns: [], rows: [] };

  const columns = r.columns.map((c) => ({ key: c, label: c }));
  const rows = r.results.map((row) => {
    const obj: Record<string, unknown> = {};
    r.columns!.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });

  return { columns, rows };
}

// ---------------------------------------------------------------------------
// Query type detection helpers
// ---------------------------------------------------------------------------

export function getDisplayType(query: Record<string, unknown>): string {
  if (query.display) return query.display as string;
  const source = query.source as Record<string, unknown> | undefined;
  if (!source) return "Unknown";
  if (source.trendsFilter) {
    return (source.trendsFilter as Record<string, unknown>).display as string ?? "ActionsLineGraph";
  }
  if (source.kind === "FunnelsQuery") return "Funnel";
  if (source.kind === "LifecycleQuery") return "Lifecycle";
  if (source.kind === "HogQLQuery") return query.display as string ?? "ActionsTable";
  return "Unknown";
}

export function getSourceKind(query: Record<string, unknown>): string {
  const source = query.source as Record<string, unknown> | undefined;
  return (source?.kind as string) ?? query.kind as string ?? "Unknown";
}
