"use client";

import { useMemo } from "react";
import { usePostHogDashboard } from "@/lib/hooks/queries/use-posthog-dashboard";
import { SectionHeader } from "@/components/primitives/section-header";
import { ChartCardSkeleton } from "@/components/primitives/skeletons/chart-card-skeleton";
import { PostHogTileRenderer } from "./posthog-tile-renderer";
import type { PostHogTile } from "@/lib/api/posthog-dashboards";

function sortTilesByLayout(tiles: PostHogTile[]): PostHogTile[] {
  return [...tiles].sort((a, b) => {
    const ay = a.layouts?.sm?.y ?? a.order ?? 0;
    const by = b.layouts?.sm?.y ?? b.order ?? 0;
    if (ay !== by) return ay - by;
    const ax = a.layouts?.sm?.x ?? 0;
    const bx = b.layouts?.sm?.x ?? 0;
    return ax - bx;
  });
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <ChartCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PostHogDashboardPage({
  dashboardId,
  title,
  description,
}: {
  dashboardId: number;
  title: string;
  description: string;
}) {
  const { data, isLoading, isError } = usePostHogDashboard(dashboardId);

  const sortedTiles = useMemo(
    () => (data ? sortTilesByLayout(data.tiles) : []),
    [data]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SectionHeader title={title} description={description} />
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <SectionHeader title={title} description={description} />
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-16 text-sm text-muted-foreground">
          Need to fetch data
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader title={title} description={description} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sortedTiles.map((tile) => (
          <PostHogTileRenderer key={tile.id} tile={tile} />
        ))}
      </div>
    </div>
  );
}
