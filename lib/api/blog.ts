import { apiGet } from "./client";
import type { KpiMetric, TimeSeriesPoint, ShareSlice } from "@/lib/mock-data/types";

type SeriesWithCompare = { current: TimeSeriesPoint[]; previous: TimeSeriesPoint[] };

export type BlogOverviewResponse = {
  kpis: {
    blogVisitors: KpiMetric;
    contentConversions: KpiMetric;
  };
  charts: {
    blogsPublished: SeriesWithCompare;
    blogVisitors: SeriesWithCompare;
    avgReadingTimeSec: SeriesWithCompare;
    contentConversions: SeriesWithCompare;
  };
  tables: {
    topCategories: ShareSlice[];
  };
};

export type BlogPostRow = {
  id: string;
  title: string;
  slug: string;
  category: string;
  visitors: number;
  timeOnPageSec: number;
  ctr: number;
  conversions: number;
  capturedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type BlogPostsMeta = {
  page: number;
  pageSize: number;
  total: number;
  [key: string]: unknown;
};

export type BlogPostsResponse = {
  data: BlogPostRow[];
  meta: BlogPostsMeta;
};

export function getBlogOverview(params: { days: number }): Promise<BlogOverviewResponse> {
  return apiGet<{ data: BlogOverviewResponse }>("/blog", { days: params.days }).then((res) => res.data);
}

export function getBlogPosts(params: {
  sort?: string;
  category?: string;
  pageSize?: number;
  page?: number;
} = {}): Promise<BlogPostsResponse> {
  return apiGet<BlogPostsResponse>("/blog/posts", params);
}
