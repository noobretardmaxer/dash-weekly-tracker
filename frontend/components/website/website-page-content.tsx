"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { SectionHeader } from "@/components/primitives/section-header";
import { SyncStatusBanner } from "@/components/primitives/sync-status-banner";
import { ChartCard } from "@/components/primitives/chart-card";
import { KpiCard } from "@/components/primitives/kpi-card";
import { DataTable } from "@/components/primitives/data-table";
import { KpiCardSkeleton } from "@/components/primitives/skeletons/kpi-card-skeleton";
import { ChartCardSkeleton } from "@/components/primitives/skeletons/chart-card-skeleton";
import { TableSkeleton } from "@/components/primitives/skeletons/table-skeleton";
import { AppLineChart } from "@/components/charts/line-chart";
import { AppAreaChart } from "@/components/charts/area-chart";
import { AppBarChart } from "@/components/charts/bar-chart";
import { AppDonutChart } from "@/components/charts/donut-chart";
import { AppFunnelChart } from "@/components/charts/funnel-chart";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { useWebsiteOverview } from "@/lib/hooks/queries/use-website-overview";
import type { LandingPageRow, ExitPageRow } from "@/lib/api/website";
import { formatCompactNumber, formatDuration, formatPercent } from "@/lib/utils/format";

const landingColumns: ColumnDef<LandingPageRow, unknown>[] = [
  { accessorKey: "page", header: "Page" },
  { accessorKey: "visitors", header: "Visitors", cell: ({ getValue }) => formatCompactNumber(getValue<number>()) },
  { accessorKey: "bounceRate", header: "Bounce Rate", cell: ({ getValue }) => formatPercent(getValue<number>()) },
  { accessorKey: "avgTimeSeconds", header: "Avg Time", cell: ({ getValue }) => formatDuration(getValue<number>()) },
];

const exitColumns: ColumnDef<ExitPageRow, unknown>[] = [
  { accessorKey: "page", header: "Page" },
  { accessorKey: "exits", header: "Exits", cell: ({ getValue }) => formatCompactNumber(getValue<number>()) },
  { accessorKey: "exitRate", header: "Exit Rate", cell: ({ getValue }) => formatPercent(getValue<number>()) },
];

export function WebsitePageContent() {
  const { days } = useDateRange();
  const { data, isLoading, isError } = useWebsiteOverview({ days });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Website Analytics" description="Traffic, engagement, and conversion across the marketing site." />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <ChartCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <TableSkeleton />
          <TableSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Website Analytics" description="Traffic, engagement, and conversion across the marketing site." />
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-16 text-sm text-muted-foreground">
          Need to fetch data
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Website Analytics" description="Traffic, engagement, and conversion across the marketing site." />
      <SyncStatusBanner integration="posthog" label="Website analytics" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <KpiCard metric={data.kpis.avgSessionDuration} />
        <KpiCard metric={data.kpis.bounceRate} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Visitors">
          {({ compare, height }) => (
            <AppLineChart
              data={data.charts.visitors.current}
              previousData={data.charts.visitors.previous}
              compare={compare}
              height={height}
              seriesLabel="Visitors"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>
        <ChartCard title="Unique Visitors">
          {({ compare, height }) => (
            <AppLineChart
              data={data.charts.uniqueVisitors.current}
              previousData={data.charts.uniqueVisitors.previous}
              compare={compare}
              height={height}
              seriesLabel="Unique Visitors"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>
        <ChartCard title="Returning Visitors">
          {({ compare, height }) => (
            <AppAreaChart
              data={data.charts.returningVisitors.current}
              previousData={data.charts.returningVisitors.previous}
              compare={compare}
              height={height}
              seriesLabel="Returning Visitors"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>
        <ChartCard title="Signups">
          {({ compare, height }) => (
            <AppLineChart
              data={data.charts.signups.current}
              previousData={data.charts.signups.previous}
              compare={compare}
              height={height}
              seriesLabel="Signups"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>
        <ChartCard title="Activation Funnel" showCompareControl={false}>
          {({ height }) => <AppFunnelChart data={data.charts.activationFunnel} height={height} valueFormatter={(v) => formatPercent(v)} />}
        </ChartCard>
        <ChartCard title="Conversion Funnel" showCompareControl={false}>
          {({ height }) => <AppFunnelChart data={data.charts.conversionFunnel} height={height} valueFormatter={(v) => formatPercent(v)} />}
        </ChartCard>
        <ChartCard title="Traffic Sources" showCompareControl={false}>
          {({ height }) => <AppDonutChart data={data.charts.trafficSources} height={height} />}
        </ChartCard>
        <ChartCard title="Device Breakdown" showCompareControl={false}>
          {({ height }) => <AppDonutChart data={data.charts.deviceBreakdown} height={height} />}
        </ChartCard>
        <ChartCard title="Country Breakdown" showCompareControl={false} className="lg:col-span-2">
          {({ height }) => (
            <AppBarChart data={data.charts.countryBreakdown} height={height} layout="horizontal" valueFormatter={(v) => `${v}%`} />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-medium">Top Landing Pages</h3>
          <DataTable columns={landingColumns} data={data.tables.topLandingPages} searchPlaceholder="Search pages…" exportFilename="top-landing-pages" />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-medium">Top Exit Pages</h3>
          <DataTable columns={exitColumns} data={data.tables.topExitPages} searchPlaceholder="Search pages…" exportFilename="top-exit-pages" />
        </div>
      </div>
    </div>
  );
}
