import { apiGet } from "./client";
import type { KpiMetric, TimeSeriesPoint } from "@/lib/mock-data/types";

type SeriesWithCompare = { current: TimeSeriesPoint[]; previous: TimeSeriesPoint[] };

export type TopTweetRow = { text: string; impressions: number; likes: number; reposts: number; replies: number };

export type TwitterOverviewResponse = {
  kpis: {
    followers: KpiMetric;
    engagementRate: KpiMetric;
  };
  charts: {
    followers: SeriesWithCompare;
    newFollowers: SeriesWithCompare;
    mentions: SeriesWithCompare;
    profileVisits: SeriesWithCompare;
    linkClicks: SeriesWithCompare;
  };
  tables: {
    topTweets: TopTweetRow[];
  };
};

export function getTwitterOverview(params: { days: number }): Promise<TwitterOverviewResponse> {
  return apiGet<{ data: TwitterOverviewResponse }>("/twitter", { days: params.days }).then((res) => res.data);
}
