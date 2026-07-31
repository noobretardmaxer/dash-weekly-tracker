"use client";

import { ChartCard } from "@/components/primitives/chart-card";
import { CompetitorOverviewChart } from "@/components/charts/comparison-bar-chart";
import { COMPETITORS } from "@/lib/constants/competitors";
import { formatCompactNumber } from "@/lib/utils/format";

export function CompetitorsTab() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Domain Rating" showCompareControl={false}>
        {({ height }) => <CompetitorOverviewChart data={COMPETITORS} metric="domainRating" height={height} />}
      </ChartCard>
      <ChartCard title="Estimated Organic Traffic" showCompareControl={false}>
        {({ height }) => (
          <CompetitorOverviewChart data={COMPETITORS} metric="estOrganicTraffic" height={height} valueFormatter={formatCompactNumber} />
        )}
      </ChartCard>
      <ChartCard title="Backlinks" showCompareControl={false}>
        {({ height }) => (
          <CompetitorOverviewChart data={COMPETITORS} metric="backlinks" height={height} valueFormatter={formatCompactNumber} />
        )}
      </ChartCard>
      <ChartCard title="Referring Domains" showCompareControl={false}>
        {({ height }) => (
          <CompetitorOverviewChart data={COMPETITORS} metric="referringDomains" height={height} valueFormatter={formatCompactNumber} />
        )}
      </ChartCard>
    </div>
  );
}
