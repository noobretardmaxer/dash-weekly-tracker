"use client";

import { useMemo } from "react";
import { SectionHeader } from "@/components/primitives/section-header";
import { SyncStatusBanner } from "@/components/primitives/sync-status-banner";
import { KpiCard } from "@/components/primitives/kpi-card";
import { DataTable } from "@/components/primitives/data-table";
import { KpiCardSkeleton } from "@/components/primitives/skeletons/kpi-card-skeleton";
import { TableSkeleton } from "@/components/primitives/skeletons/table-skeleton";
import { buildContentFeedColumns } from "@/components/social-leaderboard/content-feed-columns";
import { buildLeaderboardColumns } from "@/components/social-leaderboard/leaderboard-columns";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { useSocialLeaderboardOverview } from "@/lib/hooks/queries/use-social-leaderboard-overview";
import { useContentPosts } from "@/lib/hooks/queries/use-content-posts";
import { useLeaderboard } from "@/lib/hooks/queries/use-leaderboard";
import type { KpiMetric } from "@/lib/mock-data/types";

export function SocialLeaderboardPageContent() {
  const { days } = useDateRange();
  const overview = useSocialLeaderboardOverview({ days });
  const posts = useContentPosts({ days, pageSize: 100 });
  const leaderboard = useLeaderboard({ days });

  const feedColumns = useMemo(() => buildContentFeedColumns(days), [days]);
  const leaderboardColumns = useMemo(() => buildLeaderboardColumns(days), [days]);

  const isLoading = overview.isLoading || posts.isLoading || leaderboard.isLoading;
  const isError = overview.isError || posts.isError || leaderboard.isError;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Social Leaderboard" description="What content is going out, and who's driving the most traction." />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton rows={8} columns={7} />
        <TableSkeleton rows={6} columns={6} />
      </div>
    );
  }

  if (isError || !overview.data || !posts.data || !leaderboard.data) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Social Leaderboard" description="What content is going out, and who's driving the most traction." />
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-16 text-sm text-muted-foreground">
          Need to fetch data
        </div>
      </div>
    );
  }

  const cards: KpiMetric[] = [
    overview.data.kpis.totalPosts,
    overview.data.kpis.totalInteractions,
    overview.data.kpis.totalImpressions,
    overview.data.kpis.activeCreators,
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Social Leaderboard" description="What content is going out, and who's driving the most traction." />
      <SyncStatusBanner integration="social" label="Social Leaderboard" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((metric) => (
          <KpiCard key={metric.id} metric={metric} />
        ))}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Content Feed</h3>
        <DataTable
          columns={feedColumns}
          data={posts.data.data}
          searchPlaceholder="Search content…"
          exportFilename="content-feed"
          maxHeight={520}
          emptyTitle="No content published yet"
          emptyDescription="Posts will show up here once creators start publishing."
        />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Leaderboard</h3>
        <DataTable
          columns={leaderboardColumns}
          data={leaderboard.data}
          searchPlaceholder="Search creators…"
          exportFilename="leaderboard"
          emptyTitle="No creator activity yet"
          emptyDescription="The leaderboard fills in once posts start coming in."
        />
      </div>
    </div>
  );
}
