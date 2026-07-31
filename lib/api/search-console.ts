import { apiGet } from "./client";
import type { KpiMetric, TimeSeriesPoint } from "@/lib/mock-data/types";

export type QueryRow = { query: string; clicks: number; impressions: number; ctr: number; position: number };
export type PageRow = { page: string; clicks: number; impressions: number; ctr: number; position: number };
export type CountryRow = { country: string; clicks: number; impressions: number; ctr: number; position: number };
export type DeviceRow = { device: string; clicks: number; impressions: number; ctr: number; position: number };
export type SearchAppearanceRow = { type: string; clicks: number; impressions: number; ctr: number; position: number };

type SeriesWithCompare = { current: TimeSeriesPoint[]; previous: TimeSeriesPoint[] };

export type SearchConsoleOverviewResponse = {
  kpis: {
    clicks: KpiMetric;
    avgPosition: KpiMetric;
  };
  charts: {
    clicks: SeriesWithCompare;
    impressions: SeriesWithCompare;
    ctr: SeriesWithCompare;
    avgPosition: SeriesWithCompare;
  };
  tables: {
    topQueries: QueryRow[];
    topPages: PageRow[];
    countries: CountryRow[];
    devices: DeviceRow[];
    searchAppearance: SearchAppearanceRow[];
  };
};

export function getSearchConsoleOverview(params: { days: number }): Promise<SearchConsoleOverviewResponse> {
  return apiGet<{ data: SearchConsoleOverviewResponse }>("/search-console", { days: params.days }).then((res) => res.data);
}
