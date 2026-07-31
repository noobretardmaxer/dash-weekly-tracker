import { apiGet } from "./client";
import type { KpiMetric, TimeSeriesPoint } from "@/lib/mock-data/types";

type SeriesWithCompare = { current: TimeSeriesPoint[]; previous: TimeSeriesPoint[] };

export type TopChannelRow = { name: string; messages: number; activeMembers: number };
export type ActiveMemberRow = { username: string; messages: number; roles: string[] };

export type DiscordOverviewResponse = {
  kpis: {
    memberCount: KpiMetric;
    dau: KpiMetric;
  };
  charts: {
    memberCount: SeriesWithCompare;
    dau: SeriesWithCompare;
    wau: SeriesWithCompare;
    messages: SeriesWithCompare;
  };
  tables: {
    topChannels: TopChannelRow[];
    mostActiveMembers: ActiveMemberRow[];
  };
};

export function getDiscordOverview(params: { days: number }): Promise<DiscordOverviewResponse> {
  return apiGet<{ data: DiscordOverviewResponse }>("/discord", { days: params.days }).then((res) => res.data);
}
