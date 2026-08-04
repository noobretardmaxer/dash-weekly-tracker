import { apiGet } from "./client";
import type { KpiMetric } from "@/lib/mock-data/types";

export type SocialPlatform = "twitter" | "linkedin" | "instagram" | "youtube";

export type CreatorSummary = {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string | null;
};

export type SocialLeaderboardOverviewResponse = {
  kpis: {
    totalPosts: KpiMetric;
    totalInteractions: KpiMetric;
    totalImpressions: KpiMetric;
    activeCreators: KpiMetric;
  };
};

export type SocialPostRow = {
  id: string;
  creatorId: string;
  creator: CreatorSummary;
  platform: SocialPlatform;
  content: string;
  url: string;
  publishedAt: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  interactions: number;
};

export type SocialPostsMeta = {
  page: number;
  pageSize: number;
  total: number;
  [key: string]: unknown;
};

export type SocialPostsResponse = {
  data: SocialPostRow[];
  meta: SocialPostsMeta;
};

export type LeaderboardRow = {
  rank: number;
  movement: number | null;
  creator: CreatorSummary;
  interactions: number;
  impressions: number;
  posts: number;
};

export function getSocialLeaderboardOverview(params: { days: number }): Promise<SocialLeaderboardOverviewResponse> {
  return apiGet<{ data: SocialLeaderboardOverviewResponse }>("/social-leaderboard", { days: params.days }).then((res) => res.data);
}

export function getSocialPosts(params: {
  days?: number;
  platform?: SocialPlatform;
  pageSize?: number;
  page?: number;
  sort?: string;
} = {}): Promise<SocialPostsResponse> {
  return apiGet<SocialPostsResponse>("/social-leaderboard/posts", params);
}

export function getLeaderboard(params: {
  days?: number;
  platform?: SocialPlatform;
  sort?: "interactions" | "impressions" | "posts";
} = {}): Promise<LeaderboardRow[]> {
  return apiGet<{ data: LeaderboardRow[] }>("/social-leaderboard/leaderboard", params).then((res) => res.data);
}
