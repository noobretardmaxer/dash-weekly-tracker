import type { GscRawPayload, SearchConsoleMetricRecord } from "./types";

export async function normalize(raw: GscRawPayload, source: "gsc" | "mock"): Promise<SearchConsoleMetricRecord[]> {
  const byDate = new Map<string, Partial<SearchConsoleMetricRecord>>();

  const assign = (points: { date: string; value: number }[], key: keyof SearchConsoleMetricRecord) => {
    for (const point of points) {
      const record = byDate.get(point.date) ?? {};
      (record as Record<string, number>)[key] = point.value;
      byDate.set(point.date, record);
    }
  };

  assign(raw.clicks, "clicks");
  assign(raw.impressions, "impressions");
  assign(raw.ctr, "ctr");
  assign(raw.avgPosition, "avgPosition");

  return Array.from(byDate.entries()).map(([date, record]) => ({
    date: new Date(date),
    clicks: record.clicks ?? 0,
    impressions: record.impressions ?? 0,
    ctr: record.ctr ?? 0,
    avgPosition: record.avgPosition ?? 0,
    topQueries: raw.topQueries,
    topPages: raw.topPages,
    countries: raw.countries,
    devices: raw.devices,
    searchAppearance: raw.searchAppearance,
    source,
  }));
}
