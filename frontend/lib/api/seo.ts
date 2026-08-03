import { apiGet } from "./client";
import type { KpiMetric, TimeSeriesPoint } from "@/lib/mock-data/types";

export type SeoTopPage = { page: string; organicTraffic: number; keywords: number; avgPosition: number };
export type KeywordMovement = { keyword: string; positionChange: number; currentPosition: number };

export type KeywordRankingRow = {
  keyword: string;
  currentPosition: number;
  previousPosition: number;
  movement: number;
  searchVolume: number;
  difficulty: number;
  clicks: number;
  ctr: number;
  landingPage: string;
};

export type CompetitorRow = {
  competitorDomain: string;
  date: string;
  organicTraffic: number;
  organicKeywords: number;
  domainRating: number;
  backlinks: number;
};

type SeriesWithCompare = { current: TimeSeriesPoint[]; previous: TimeSeriesPoint[] };

export type SeoOverviewResponse = {
  kpis: {
    organicTraffic: KpiMetric;
    organicKeywords: KpiMetric;
    domainRating: KpiMetric;
    backlinks: KpiMetric;
    referringDomains: KpiMetric;
    lostBacklinks: KpiMetric;
    newBacklinks: KpiMetric;
  };
  charts: {
    organicTraffic: SeriesWithCompare;
    organicKeywords: SeriesWithCompare;
    domainRating: SeriesWithCompare;
    backlinks: SeriesWithCompare;
    referringDomains: SeriesWithCompare;
    newBacklinks: SeriesWithCompare;
    lostBacklinks: SeriesWithCompare;
  };
  tables: {
    topPages: SeoTopPage[];
    fastestGrowingKeywords: KeywordMovement[];
    losingKeywords: KeywordMovement[];
  };
};

export function getSeoOverview(params: { days: number }): Promise<SeoOverviewResponse> {
  return apiGet<{ data: SeoOverviewResponse }>("/seo", { days: params.days }).then((res) => res.data);
}

export function getKeywordRankings(params: { sort?: string; search?: string; pageSize?: number } = {}): Promise<KeywordRankingRow[]> {
  return apiGet<{ data: KeywordRankingRow[] }>("/seo/keywords", {
    sort: params.sort,
    search: params.search,
    pageSize: params.pageSize,
  }).then((res) => res.data);
}

export function getCompetitors(): Promise<CompetitorRow[]> {
  return apiGet<{ data: CompetitorRow[] }>("/seo/competitors").then((res) => res.data);
}
