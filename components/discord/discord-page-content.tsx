"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { SectionHeader } from "@/components/primitives/section-header";
import { ChartCard } from "@/components/primitives/chart-card";
import { KpiCard } from "@/components/primitives/kpi-card";
import { DataTable } from "@/components/primitives/data-table";
import { AppLineChart } from "@/components/charts/line-chart";
import { AppBarChart } from "@/components/charts/bar-chart";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { sliceLastNDays, getPreviousPeriod, buildKpiMetric } from "@/lib/mock-data/utils";
import {
  membersSeries,
  dauSeries,
  wauSeries,
  messagesSeries,
  topChannels,
  mostActiveMembers,
} from "@/lib/mock-data/discord";
import { formatCompactNumber } from "@/lib/utils/format";

type ChannelRow = (typeof topChannels)[number];
type MemberRow = (typeof mostActiveMembers)[number];

const channelColumns: ColumnDef<ChannelRow, unknown>[] = [
  { accessorKey: "name", header: "Channel" },
  { accessorKey: "messages", header: "Messages", cell: ({ getValue }) => formatCompactNumber(getValue<number>()) },
  { accessorKey: "activeMembers", header: "Active Members", cell: ({ getValue }) => formatCompactNumber(getValue<number>()) },
];

const memberColumns: ColumnDef<MemberRow, unknown>[] = [
  { accessorKey: "username", header: "Member" },
  { accessorKey: "messages", header: "Messages", cell: ({ getValue }) => formatCompactNumber(getValue<number>()) },
  { accessorKey: "roles", header: "Roles", cell: ({ getValue }) => getValue<string[]>().join(", ") },
];

export function DiscordPageContent() {
  const { days } = useDateRange();

  const cards = [
    buildKpiMetric({ id: "members", label: "Members", format: "compact", fullSeries: membersSeries, rangeDays: days, aggregate: "last" }),
    buildKpiMetric({ id: "dau", label: "Daily Active Users", format: "compact", fullSeries: dauSeries, rangeDays: days, aggregate: "average" }),
    buildKpiMetric({ id: "wau", label: "Weekly Active Users", format: "compact", fullSeries: wauSeries, rangeDays: days, aggregate: "average" }),
    buildKpiMetric({ id: "messages", label: "Messages", format: "compact", fullSeries: messagesSeries, rangeDays: days, aggregate: "sum" }),
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Discord" description="Community growth and engagement across the HydraDB Discord server." />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((metric) => (
          <KpiCard key={metric.id} metric={metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Member Growth">
          {({ compare, height }) => (
            <AppLineChart
              data={sliceLastNDays(membersSeries, days)}
              previousData={getPreviousPeriod(membersSeries, days)}
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
              data={sliceLastNDays(dauSeries, days)}
              previousData={getPreviousPeriod(dauSeries, days)}
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
              data={sliceLastNDays(messagesSeries, days)}
              previousData={getPreviousPeriod(messagesSeries, days)}
              compare={compare}
              height={height}
              seriesLabel="Messages"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>
        <ChartCard title="Top Channels" showCompareControl={false} className="lg:col-span-2">
          {({ height }) => (
            <AppBarChart data={topChannels.map((c) => ({ name: c.name, value: c.messages }))} height={height} layout="horizontal" valueFormatter={formatCompactNumber} />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-medium">Top Channels</h3>
          <DataTable columns={channelColumns} data={topChannels} searchPlaceholder="Search channels…" exportFilename="discord-top-channels" />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-medium">Most Active Members</h3>
          <DataTable columns={memberColumns} data={mostActiveMembers} searchPlaceholder="Search members…" exportFilename="discord-active-members" />
        </div>
      </div>
    </div>
  );
}
