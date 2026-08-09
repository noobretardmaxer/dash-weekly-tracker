"use client";

import { ChartCard } from "@/components/primitives/chart-card";
import { ChartCardSkeleton } from "@/components/primitives/skeletons/chart-card-skeleton";
import { EmptyState } from "@/components/primitives/empty-state";
import { DataSourceCaption } from "@/components/primitives/data-source-caption";
import { CompetitorOverviewChart } from "@/components/charts/comparison-bar-chart";
import { useCompetitors } from "@/lib/hooks/queries/use-competitors";
import { formatCompactNumber } from "@/lib/utils/format";
import type { CompetitorProfile } from "@/lib/constants/competitors";
import type { CompetitorRow } from "@/lib/api/seo";
import { Users } from "lucide-react";

function toProfiles(rows: CompetitorRow[]): CompetitorProfile[] {
  return rows.map((r) => ({
    name: r.competitorDomain,
    authorityScore: r.authorityScore,
    backlinks: r.backlinks,
    organicTraffic: r.organicTraffic,
    organicKeywords: r.organicKeywords,
    isHydraDB: r.competitorDomain.toLowerCase().includes("hydradb"),
  }));
}

export function CompetitorsTab() {
  const { data: rows, isLoading, isError } = useCompetitors();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <ChartCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !rows || rows.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No competitor data yet"
        description="Data will appear after the SEMrush sync completes. Trigger a manual sync via POST /api/v1/admin/sync/semrush if this is a fresh deploy."
      />
    );
  }

  const competitors = toProfiles(rows);

  return (
    <div className="space-y-4">
      <DataSourceCaption asOf={rows[0]?.date} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Authority Score" showCompareControl={false}>
          {({ height }) => <CompetitorOverviewChart data={competitors} metric="authorityScore" height={height} />}
        </ChartCard>
        <ChartCard title="Estimated Organic Traffic" showCompareControl={false}>
          {({ height }) => (
            <CompetitorOverviewChart data={competitors} metric="organicTraffic" height={height} valueFormatter={formatCompactNumber} />
          )}
        </ChartCard>
        <ChartCard title="Backlinks" showCompareControl={false}>
          {({ height }) => (
            <CompetitorOverviewChart data={competitors} metric="backlinks" height={height} valueFormatter={formatCompactNumber} />
          )}
        </ChartCard>
        <ChartCard title="Organic Keywords" showCompareControl={false}>
          {({ height }) => (
            <CompetitorOverviewChart data={competitors} metric="organicKeywords" height={height} valueFormatter={formatCompactNumber} />
          )}
        </ChartCard>
      </div>
    </div>
  );
}
