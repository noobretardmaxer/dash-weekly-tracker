"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ChartCard } from "@/components/primitives/chart-card";
import { KpiCard } from "@/components/primitives/kpi-card";
import { DataTable } from "@/components/primitives/data-table";
import { AppLineChart } from "@/components/charts/line-chart";
import { AppBarChart } from "@/components/charts/bar-chart";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { sliceLastNDays, getPreviousPeriod, buildKpiMetric } from "@/lib/mock-data/utils";
import {
  organicTrafficSeries,
  organicKeywordsSeries,
  domainRatingSeries,
  backlinksSeries,
  referringDomainsSeries,
  newBacklinksSeries,
  lostBacklinksSeries,
  seoTopPages,
  fastestGrowingKeywords,
  losingKeywords,
} from "@/lib/mock-data/seo";
import { keywordRankings } from "@/lib/mock-data/keywords";
import { formatCompactNumber, formatPercent } from "@/lib/utils/format";

type TopPageRow = (typeof seoTopPages)[number];

const topPagesColumns: ColumnDef<TopPageRow, unknown>[] = [
  { accessorKey: "page", header: "Page" },
  { accessorKey: "organicTraffic", header: "Organic Traffic", cell: ({ getValue }) => formatCompactNumber(getValue<number>()) },
  { accessorKey: "keywords", header: "Keywords" },
  { accessorKey: "avgPosition", header: "Avg Position", cell: ({ getValue }) => `#${getValue<number>().toFixed(1)}` },
];

const topKeywords = [...keywordRankings].sort((a, b) => b.clicks - a.clicks).slice(0, 15);
type TopKeywordRow = (typeof topKeywords)[number];

const topKeywordsColumns: ColumnDef<TopKeywordRow, unknown>[] = [
  { accessorKey: "keyword", header: "Keyword" },
  { accessorKey: "currentPosition", header: "Position", cell: ({ getValue }) => `#${getValue<number>()}` },
  { accessorKey: "searchVolume", header: "Volume", cell: ({ getValue }) => formatCompactNumber(getValue<number>()) },
  { accessorKey: "clicks", header: "Clicks", cell: ({ getValue }) => formatCompactNumber(getValue<number>()) },
  { accessorKey: "ctr", header: "CTR", cell: ({ getValue }) => formatPercent(getValue<number>()) },
];

export function SeoOverview() {
  const { days } = useDateRange();

  const cards = [
    buildKpiMetric({ id: "organic-traffic", label: "Organic Traffic", format: "compact", fullSeries: organicTrafficSeries, rangeDays: days, aggregate: "sum" }),
    buildKpiMetric({ id: "organic-keywords", label: "Organic Keywords", format: "compact", fullSeries: organicKeywordsSeries, rangeDays: days, aggregate: "last" }),
    buildKpiMetric({ id: "domain-rating", label: "Domain Rating", format: "number", fullSeries: domainRatingSeries, rangeDays: days, aggregate: "last" }),
    buildKpiMetric({ id: "backlinks", label: "Backlinks", format: "compact", fullSeries: backlinksSeries, rangeDays: days, aggregate: "last" }),
    buildKpiMetric({ id: "referring-domains", label: "Referring Domains", format: "compact", fullSeries: referringDomainsSeries, rangeDays: days, aggregate: "last" }),
    buildKpiMetric({ id: "lost-backlinks", label: "Lost Backlinks", format: "number", fullSeries: lostBacklinksSeries, rangeDays: days, aggregate: "sum", positiveIsGood: false }),
    buildKpiMetric({ id: "new-backlinks", label: "New Backlinks", format: "number", fullSeries: newBacklinksSeries, rangeDays: days, aggregate: "sum" }),
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
              data={sliceLastNDays(organicTrafficSeries, days)}
              previousData={getPreviousPeriod(organicTrafficSeries, days)}
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
              data={sliceLastNDays(organicKeywordsSeries, days)}
              previousData={getPreviousPeriod(organicKeywordsSeries, days)}
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
              data={sliceLastNDays(backlinksSeries, days)}
              previousData={getPreviousPeriod(backlinksSeries, days)}
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
              data={fastestGrowingKeywords.map((k) => ({ name: k.keyword, value: k.positionChange }))}
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
              data={losingKeywords.map((k) => ({ name: k.keyword, value: k.positionChange }))}
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
          <DataTable columns={topPagesColumns} data={seoTopPages} searchPlaceholder="Search pages…" exportFilename="seo-top-pages" />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-medium">Top Keywords</h3>
          <DataTable columns={topKeywordsColumns} data={topKeywords} searchPlaceholder="Search keywords…" exportFilename="seo-top-keywords" />
        </div>
      </div>
    </div>
  );
}
