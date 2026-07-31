"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { SectionHeader } from "@/components/primitives/section-header";
import { ChartCard } from "@/components/primitives/chart-card";
import { KpiCard } from "@/components/primitives/kpi-card";
import { DataTable } from "@/components/primitives/data-table";
import { ContentToSignupsFlow } from "@/components/content/content-to-signups-flow";
import { AppLineChart } from "@/components/charts/line-chart";
import { AppBarChart } from "@/components/charts/bar-chart";
import { AppDonutChart } from "@/components/charts/donut-chart";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { sliceLastNDays, getPreviousPeriod, buildKpiMetric } from "@/lib/mock-data/utils";
import {
  blogsPublishedSeries,
  blogVisitorsSeries,
  avgReadingTimeSeries,
  contentConversionsSeries,
  contentGrowthSeries,
  trafficByBlog,
  topCategories,
  topBlogs,
} from "@/lib/mock-data/content";
import { formatCompactNumber, formatDuration, formatPercent } from "@/lib/utils/format";

type TopBlogRow = (typeof topBlogs)[number];

const topBlogsColumns: ColumnDef<TopBlogRow, unknown>[] = [
  { accessorKey: "title", header: "Blog" },
  { accessorKey: "visitors", header: "Visitors", cell: ({ getValue }) => formatCompactNumber(getValue<number>()) },
  { accessorKey: "timeOnPageSeconds", header: "Time on Page", cell: ({ getValue }) => formatDuration(getValue<number>()) },
  { accessorKey: "ctr", header: "CTR", cell: ({ getValue }) => formatPercent(getValue<number>()) },
  { accessorKey: "conversions", header: "Conversions" },
];

export function ContentPageContent() {
  const { days } = useDateRange();

  const cards = [
    buildKpiMetric({ id: "blogs-published", label: "Blogs Published", format: "number", fullSeries: blogsPublishedSeries, rangeDays: days, aggregate: "sum" }),
    buildKpiMetric({ id: "blog-visitors", label: "Blog Visitors", format: "compact", fullSeries: blogVisitorsSeries, rangeDays: days, aggregate: "sum" }),
    buildKpiMetric({ id: "avg-reading-time", label: "Average Reading Time", format: "duration", fullSeries: avgReadingTimeSeries, rangeDays: days, aggregate: "average" }),
    buildKpiMetric({ id: "content-conversions", label: "Conversions", format: "number", fullSeries: contentConversionsSeries, rangeDays: days, aggregate: "sum" }),
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Content" description="Blog publishing cadence, traffic, and downstream conversions." />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((metric) => (
          <KpiCard key={metric.id} metric={metric} />
        ))}
      </div>

      <ContentToSignupsFlow />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Content Growth">
          {({ compare, height }) => (
            <AppLineChart
              data={sliceLastNDays(contentGrowthSeries, days)}
              previousData={getPreviousPeriod(contentGrowthSeries, days)}
              compare={compare}
              height={height}
              seriesLabel="Blog Visitors"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>
        <ChartCard title="Traffic by Blog" showCompareControl={false}>
          {({ height }) => <AppBarChart data={trafficByBlog} height={height} layout="horizontal" valueFormatter={formatCompactNumber} />}
        </ChartCard>
        <ChartCard title="Top Categories" showCompareControl={false} className="lg:col-span-2">
          {({ height }) => <AppDonutChart data={topCategories} height={height} valueFormatter={formatCompactNumber} />}
        </ChartCard>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Top Blogs</h3>
        <DataTable columns={topBlogsColumns} data={topBlogs} searchPlaceholder="Search blogs…" exportFilename="top-blogs" />
      </div>
    </div>
  );
}
