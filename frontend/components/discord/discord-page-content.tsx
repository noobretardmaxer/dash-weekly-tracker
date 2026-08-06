"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { SectionHeader } from "@/components/primitives/section-header";
import { SyncStatusBanner } from "@/components/primitives/sync-status-banner";
import { ChartCard } from "@/components/primitives/chart-card";
import { KpiCard } from "@/components/primitives/kpi-card";
import { DataTable } from "@/components/primitives/data-table";
import { ErrorState } from "@/components/primitives/error-state";
import { KpiCardSkeleton } from "@/components/primitives/skeletons/kpi-card-skeleton";
import { ChartCardSkeleton } from "@/components/primitives/skeletons/chart-card-skeleton";
import { TableSkeleton } from "@/components/primitives/skeletons/table-skeleton";
import { AppLineChart } from "@/components/charts/line-chart";
import { AppBarChart } from "@/components/charts/bar-chart";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { useDiscordOverview } from "@/lib/hooks/queries/use-discord-overview";
import type { TopChannelRow, ActiveMemberRow } from "@/lib/api/discord";
import type { KpiFormat, KpiMetric, TimeSeriesPoint } from "@/lib/mock-data/types";
import { formatCompactNumber } from "@/lib/utils/format";

type SeriesWithCompare = { current: TimeSeriesPoint[]; previous: TimeSeriesPoint[] };

function sumSeriesKpi(
  id: string,
  label: string,
  format: KpiFormat,
  chart: SeriesWithCompare,
  positiveIsGood = true
): KpiMetric {
  const sum = (arr: TimeSeriesPoint[]) => arr.reduce((a, p) => a + p.value, 0);
  const value = sum(chart.current);
  const prevValue = sum(chart.previous);
  const deltaPct = prevValue === 0 ? 0 : Number((((value - prevValue) / prevValue) * 100).toFixed(1));

  return {
    id,
    label,
    value,
    format,
    deltaPct,
    positiveIsGood,
    series: chart.current,
  };
}

function averageSeriesKpi(
  id: string,
  label: string,
  format: KpiFormat,
  chart: SeriesWithCompare,
  positiveIsGood = true
): KpiMetric {
  const average = (arr: TimeSeriesPoint[]) => (arr.length === 0 ? 0 : arr.reduce((a, p) => a + p.value, 0) / arr.length);
  const value = average(chart.current);
  const prevValue = average(chart.previous);
  const deltaPct = prevValue === 0 ? 0 : Number((((value - prevValue) / prevValue) * 100).toFixed(1));

  return {
    id,
    label,
    value,
    format,
    deltaPct,
    positiveIsGood,
    series: chart.current,
  };
}

const channelColumns: ColumnDef<TopChannelRow, unknown>[] = [
  { accessorKey: "name", header: "Channel" },
  { accessorKey: "messages", header: "Messages", cell: ({ getValue }) => formatCompactNumber(getValue<number>()) },
  { accessorKey: "activeMembers", header: "Active Members", cell: ({ getValue }) => formatCompactNumber(getValue<number>()) },
];

const memberColumns: ColumnDef<ActiveMemberRow, unknown>[] = [
  { accessorKey: "username", header: "Member" },
  { accessorKey: "messages", header: "Messages", cell: ({ getValue }) => formatCompactNumber(getValue<number>()) },
  { accessorKey: "roles", header: "Roles", cell: ({ getValue }) => getValue<string[]>().join(", ") },
];

export function DiscordPageContent() {
  const { days } = useDateRange();
  const { data, isLoading, isError, refetch } = useDiscordOverview({ days });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Discord" description="Community growth and engagement across the HydraDB Discord server." />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
          <ChartCardSkeleton />
          <ChartCardSkeleton />
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
        <SectionHeader title="Discord" description="Community growth and engagement across the HydraDB Discord server." />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  const cards: KpiMetric[] = [
    data.kpis.memberCount,
    data.kpis.dau,
    averageSeriesKpi("wau", "Weekly Active Users", "compact", data.charts.wau),
    sumSeriesKpi("messages", "Messages", "compact", data.charts.messages),
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Discord" description="Community growth and engagement across the HydraDB Discord server." />
      <SyncStatusBanner integration="discord" label="Discord" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((metric) => (
          <KpiCard key={metric.id} metric={metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Member Growth">
          {({ compare, height }) => (
            <AppLineChart
              data={data.charts.memberCount.current}
              previousData={data.charts.memberCount.previous}
              compare={compare}
              height={height}
              seriesLabel="Members"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>
        <ChartCard title="Active Members">
          {({ compare, height }) => (
            <AppLineChart
              data={data.charts.dau.current}
              previousData={data.charts.dau.previous}
              compare={compare}
              height={height}
              seriesLabel="Daily Active Users"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>
        <ChartCard title="Messages Per Day" showCompareControl className="lg:col-span-2">
          {({ compare, height }) => (
            <AppLineChart
              data={data.charts.messages.current}
              previousData={data.charts.messages.previous}
              compare={compare}
              height={height}
              seriesLabel="Messages"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>
        <ChartCard title="Top Channels" showCompareControl={false} className="lg:col-span-2">
          {({ height }) => (
            <AppBarChart
              data={data.tables.topChannels.map((c) => ({ name: c.name, value: c.messages }))}
              height={height}
              layout="horizontal"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-medium">Top Channels</h3>
          <DataTable columns={channelColumns} data={data.tables.topChannels} searchPlaceholder="Search channels…" exportFilename="discord-top-channels" />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-medium">Most Active Members</h3>
          <DataTable columns={memberColumns} data={data.tables.mostActiveMembers} searchPlaceholder="Search members…" exportFilename="discord-active-members" />
        </div>
      </div>
    </div>
  );
}
