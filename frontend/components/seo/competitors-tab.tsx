"use client";

import { ChartCard } from "@/components/primitives/chart-card";
import { CompetitorOverviewChart } from "@/components/charts/comparison-bar-chart";
import { useCompetitors } from "@/lib/hooks/queries/use-competitors";
import { formatCompactNumber } from "@/lib/utils/format";
import type { CompetitorProfile } from "@/lib/constants/competitors";
import type { CompetitorRow } from "@/lib/api/seo";

function toProfiles(rows: CompetitorRow[]): CompetitorProfile[] {
  return rows.map((r) => ({
    name: r.competitorDomain,
    domainRating: r.domainRating,
    backlinks: r.backlinks,
    organicTraffic: r.organicTraffic,
    organicKeywords: r.organicKeywords,
    isHydraDB: r.competitorDomain.toLowerCase().includes("hydradb"),
  }));
}

export function CompetitorsTab() {
  const { data: rows } = useCompetitors();
  const competitors: CompetitorProfile[] = rows ? toProfiles(rows) : [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Domain Rating" showCompareControl={false}>
        {({ height }) => <CompetitorOverviewChart data={competitors} metric="domainRating" height={height} />}
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
  );
}
