import { apiGet } from "./client";
import type { KpiMetric, TimeSeriesPoint } from "@/lib/mock-data/types";

type SeriesWithCompare = { current: TimeSeriesPoint[]; previous: TimeSeriesPoint[] };

export type DashboardOverviewResponse = {
  kpiGrid: KpiMetric[];
  previewCharts: {
    visitors: SeriesWithCompare;
    organicClicks: SeriesWithCompare;
    backlinks: SeriesWithCompare;
  };
};

export function getDashboardOverview(params: { days: number }): Promise<DashboardOverviewResponse> {
  return apiGet<{ data: DashboardOverviewResponse }>("/dashboard", { days: params.days }).then((res) => res.data);
}
