"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ChartCard } from "@/components/primitives/chart-card";
import { KpiCard } from "@/components/primitives/kpi-card";
import { DataTable } from "@/components/primitives/data-table";
import { KpiCardSkeleton } from "@/components/primitives/skeletons/kpi-card-skeleton";
import { ChartCardSkeleton } from "@/components/primitives/skeletons/chart-card-skeleton";
import { TableSkeleton } from "@/components/primitives/skeletons/table-skeleton";
import { AppLineChart } from "@/components/charts/line-chart";
import { AppBarChart } from "@/components/charts/bar-chart";
import { EmptyState } from "@/components/primitives/empty-state";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { useSeoOverview } from "@/lib/hooks/queries/use-seo-overview";
import { useKeywordRankings } from "@/lib/hooks/queries/use-keyword-rankings";
import type { SeoTopPage, KeywordRankingRow } from "@/lib/api/seo";
import { formatCompactNumber, formatPercent } from "@/lib/utils/format";
import { TrendingUp } from "lucide-react";

const topPagesColumns: ColumnDef<SeoTopPage, unknown>[] = [
  { accessorKey: "page", header: "Page" },
  { accessorKey: "organicTraffic", header: "Organic Traffic", cell: ({ getValue }) => formatCompactNumber(getValue<number>()) },
  { accessorKey: "keywords", header: "Keywords" },
  { accessorKey: "avgPosition", header: "Avg Position", cell: ({ getValue }) => `#${getValue<number>().toFixed(1)}` },
];

const topKeywordsColumns: ColumnDef<KeywordRankingRow, unknown>[] = [
  { accessorKey: "keyword", header: "Keyword" },
  { accessorKey: "currentPosition", header: "Position", cell: ({ getValue }) => `#${getValue<number>()}` },
  { accessorKey: "searchVolume", header: "Volume", cell: ({ getValue }) => formatCompactNumber(getValue<number>()) },
  { accessorKey: "clicks", header: "Clicks", cell: ({ getValue }) => formatCompactNumber(getValue<number>()) },
  { accessorKey: "ctr", header: "CTR", cell: ({ getValue }) => formatPercent(getValue<number>()) },
];

export function SeoOverview() {
  const { days } = useDateRange();
  const { data, isLoading, isError } = useSeoOverview({ days });
  const {
    data: topKeywords,
    isLoading: isTopKeywordsLoading,
    isError: isTopKeywordsError,
  } = useKeywordRankings({ sort: "clicks:desc", pageSize: 15 });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ChartCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
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
      <EmptyState
        icon={TrendingUp}
        title="No SEO data yet"
        description="Data will appear after the SEMrush sync completes. Trigger a manual sync via POST /api/v1/admin/sync/semrush if this is a fresh deploy."
      />
    );
  }

  const cards = [
    data.kpis.organicTraffic,
    data.kpis.organicKeywords,
    data.kpis.domainRating,
    data.kpis.backlinks,
    data.kpis.referringDomains,
    data.kpis.lostBacklinks,
    data.kpis.newBacklinks,
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((metric) => (
          <KpiCard key={metric.id} metric={metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Traffic Growth">
          {({ compare, height }) => (
            <AppLineChart
              data={data.charts.organicTraffic.current}
              previousData={data.charts.organicTraffic.previous}
              compare={compare}
              height={height}
              seriesLabel="Organic Traffic"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>
        <ChartCard title="Keyword Growth">
          {({ compare, height }) => (
            <AppLineChart
              data={data.charts.organicKeywords.current}
              previousData={data.charts.organicKeywords.previous}
              compare={compare}
              height={height}
              seriesLabel="Keywords"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>
        <ChartCard title="Backlink Growth">
          {({ compare, height }) => (
            <AppLineChart
              data={data.charts.backlinks.current}
              previousData={data.charts.backlinks.previous}
              compare={compare}
              height={height}
              seriesLabel="Backlinks"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Fastest Growing Keywords" showCompareControl={false}>
          {({ height }) => (
            <AppBarChart
              data={data.tables.fastestGrowingKeywords.map((k) => ({ name: k.keyword, value: k.positionChange }))}
              height={height}
              layout="horizontal"
              barColor="var(--success)"
              valueFormatter={(v) => `+${v}`}
            />
          )}
        </ChartCard>
        <ChartCard title="Losing Keywords" showCompareControl={false}>
          {({ height }) => (
            <AppBarChart
              data={data.tables.losingKeywords.map((k) => ({ name: k.keyword, value: k.positionChange }))}
              height={height}
              layout="horizontal"
              barColor="var(--danger)"
              valueFormatter={(v) => `${v}`}
            />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-medium">Top Pages</h3>
          <DataTable columns={topPagesColumns} data={data.tables.topPages} searchPlaceholder="Search pages…" exportFilename="seo-top-pages" />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-medium">Top Keywords</h3>
          {isTopKeywordsLoading ? (
            <TableSkeleton />
          ) : isTopKeywordsError || !topKeywords ? (
            <EmptyState title="No keyword data yet" description="Keyword rankings will appear after the next SEMrush sync." />
          ) : (
            <DataTable
              columns={topKeywordsColumns}
              data={topKeywords}
              searchPlaceholder="Search keywords…"
              exportFilename="seo-top-keywords"
            />
          )}
        </div>
      </div>
    </div>
  );
}
