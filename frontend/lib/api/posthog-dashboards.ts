import { apiGet } from "./client";

export type GridLayout = { x: number; y: number; w: number; h: number };

export type PostHogInsight = {
  id: number;
  short_id: string;
  name: string;
  description?: string;
  query: Record<string, unknown>;
  result: unknown;
  last_refresh?: string;
};

export type PostHogTile = {
  id: number;
  text?: { body: string };
  insight?: PostHogInsight;
  layouts?: { sm?: GridLayout; xs?: GridLayout };
  order?: number;
};

export type PostHogDashboard = {
  id: number;
  name: string;
  description?: string;
  tiles: PostHogTile[];
};

export async function getPostHogDashboard(dashboardId: number): Promise<PostHogDashboard> {
  const res = await apiGet<{ data: PostHogDashboard }>(`/posthog-dashboards/${dashboardId}`);
  return res.data;
}
