"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { SectionHeader } from "@/components/primitives/section-header";
import { ChartCard } from "@/components/primitives/chart-card";
import { KpiCard } from "@/components/primitives/kpi-card";
import { DataTable } from "@/components/primitives/data-table";
import { AppLineChart } from "@/components/charts/line-chart";
import { AppAreaChart } from "@/components/charts/area-chart";
import { AppBarChart } from "@/components/charts/bar-chart";
import { AppDonutChart } from "@/components/charts/donut-chart";
import { AppFunnelChart } from "@/components/charts/funnel-chart";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { sliceLastNDays, getPreviousPeriod, buildKpiMetric } from "@/lib/mock-data/utils";
import {
  visitorsSeries,
  uniqueVisitorsSeries,
  returningVisitorsSeries,
  signupsSeries,
  activationFunnel,
  conversionFunnel,
  trafficSources,
  deviceBreakdown,
  countryBreakdown,
  avgSessionDurationSeries,
  bounceRateSeries,
  topLandingPages,
  topExitPages,
} from "@/lib/mock-data/website";
import { formatCompactNumber, formatDuration, formatPercent } from "@/lib/utils/format";

type LandingPageRow = (typeof topLandingPages)[number];
type ExitPageRow = (typeof topExitPages)[number];

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

  const avgSessionDuration = buildKpiMetric({
    id: "avg-session-duration",
    label: "Average Session Duration",
    format: "duration",
    fullSeries: avgSessionDurationSeries,
    rangeDays: days,
    aggregate: "average",
  });

  const bounceRate = buildKpiMetric({
    id: "bounce-rate",
    label: "Bounce Rate",
    format: "percent",
    fullSeries: bounceRateSeries,
    rangeDays: days,
    aggregate: "average",
    positiveIsGood: false,
  });

  return (
    <div className="space-y-6">
      <SectionHeader title="Website Analytics" description="Traffic, engagement, and conversion across the marketing site." />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <KpiCard metric={avgSessionDuration} />
        <KpiCard metric={bounceRate} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Visitors">
          {({ compare, height }) => (
            <AppLineChart
              data={sliceLastNDays(visitorsSeries, days)}
              previousData={getPreviousPeriod(visitorsSeries, days)}
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
              data={sliceLastNDays(uniqueVisitorsSeries, days)}
              previousData={getPreviousPeriod(uniqueVisitorsSeries, days)}
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
              data={sliceLastNDays(returningVisitorsSeries, days)}
              previousData={getPreviousPeriod(returningVisitorsSeries, days)}
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
              data={sliceLastNDays(signupsSeries, days)}
              previousData={getPreviousPeriod(signupsSeries, days)}
              compare={compare}
              height={height}
              seriesLabel="Signups"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>
        <ChartCard title="Activation Funnel" showCompareControl={false}>
          {({ height }) => <AppFunnelChart data={activationFunnel} height={height} valueFormatter={(v) => formatPercent(v)} />}
        </ChartCard>
        <ChartCard title="Conversion Funnel" showCompareControl={false}>
          {({ height }) => <AppFunnelChart data={conversionFunnel} height={height} valueFormatter={(v) => formatPercent(v)} />}
        </ChartCard>
        <ChartCard title="Traffic Sources" showCompareControl={false}>
          {({ height }) => <AppDonutChart data={trafficSources} height={height} />}
        </ChartCard>
        <ChartCard title="Device Breakdown" showCompareControl={false}>
          {({ height }) => <AppDonutChart data={deviceBreakdown} height={height} />}
        </ChartCard>
        <ChartCard title="Country Breakdown" showCompareControl={false} className="lg:col-span-2">
          {({ height }) => (
            <AppBarChart data={countryBreakdown} height={height} layout="horizontal" valueFormatter={(v) => `${v}%`} />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-medium">Top Landing Pages</h3>
          <DataTable columns={landingColumns} data={topLandingPages} searchPlaceholder="Search pages…" exportFilename="top-landing-pages" />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-medium">Top Exit Pages</h3>
          <DataTable columns={exitColumns} data={topExitPages} searchPlaceholder="Search pages…" exportFilename="top-exit-pages" />
        </div>
      </div>
    </div>
  );
}
