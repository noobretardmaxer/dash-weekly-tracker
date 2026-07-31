import { apiGet } from "./client";
import type { KpiMetric, TimeSeriesPoint, ShareSlice, FunnelStep } from "@/lib/mock-data/types";

export type LandingPageRow = { page: string; visitors: number; bounceRate: number; avgTimeSeconds: number };
export type ExitPageRow = { page: string; exits: number; exitRate: number };

type SeriesWithCompare = { current: TimeSeriesPoint[]; previous: TimeSeriesPoint[] };

export type WebsiteOverviewResponse = {
  kpis: {
    avgSessionDuration: KpiMetric;
    bounceRate: KpiMetric;
  };
  charts: {
    visitors: SeriesWithCompare;
    uniqueVisitors: SeriesWithCompare;
    returningVisitors: SeriesWithCompare;
    signups: SeriesWithCompare;
    trafficSources: ShareSlice[];
    deviceBreakdown: ShareSlice[];
    countryBreakdown: ShareSlice[];
    activationFunnel: FunnelStep[];
    conversionFunnel: FunnelStep[];
  };
  tables: {
    topLandingPages: LandingPageRow[];
    topExitPages: ExitPageRow[];
  };
};

export function getWebsiteOverview(params: { days: number }): Promise<WebsiteOverviewResponse> {
  return apiGet<{ data: WebsiteOverviewResponse }>("/website", { days: params.days }).then((res) => res.data);
}
