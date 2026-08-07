"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { SectionHeader } from "@/components/primitives/section-header";
import { SyncStatusBanner } from "@/components/primitives/sync-status-banner";
import { ChartCard } from "@/components/primitives/chart-card";
import { KpiCard } from "@/components/primitives/kpi-card";
import { DataTable } from "@/components/primitives/data-table";
import { ContentToSignupsFlow } from "@/components/content/content-to-signups-flow";
import { KpiCardSkeleton } from "@/components/primitives/skeletons/kpi-card-skeleton";
import { ChartCardSkeleton } from "@/components/primitives/skeletons/chart-card-skeleton";
import { TableSkeleton } from "@/components/primitives/skeletons/table-skeleton";
import { AppLineChart } from "@/components/charts/line-chart";
import { AppBarChart } from "@/components/charts/bar-chart";
import { AppDonutChart } from "@/components/charts/donut-chart";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { useBlogOverview } from "@/lib/hooks/queries/use-blog-overview";
import { useBlogPosts } from "@/lib/hooks/queries/use-blog-posts";
import type { BlogPostRow } from "@/lib/api/blog";
import type { KpiFormat, KpiMetric, TimeSeriesPoint } from "@/lib/mock-data/types";
import { formatCompactNumber, formatDuration, formatPercent } from "@/lib/utils/format";

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

const topBlogsColumns: ColumnDef<BlogPostRow, unknown>[] = [
  { accessorKey: "title", header: "Blog" },
  { accessorKey: "visitors", header: "Visitors", cell: ({ getValue }) => formatCompactNumber(getValue<number>()) },
  { accessorKey: "timeOnPageSec", header: "Time on Page", cell: ({ getValue }) => formatDuration(getValue<number>()) },
  { accessorKey: "ctr", header: "CTR", cell: ({ getValue }) => formatPercent(getValue<number>()) },
  { accessorKey: "conversions", header: "Conversions" },
];

export function ContentPageContent() {
  const { days } = useDateRange();
  const overview = useBlogOverview({ days });
  const trafficPosts = useBlogPosts({ sort: "visitors:desc", pageSize: 8 });
  const topBlogsPosts = useBlogPosts({ pageSize: 200 });

  const isLoading = overview.isLoading || trafficPosts.isLoading || topBlogsPosts.isLoading;
  const isError = overview.isError || trafficPosts.isError || topBlogsPosts.isError;
  const data = overview.data;
  const trafficData = trafficPosts.data;
  const topBlogsData = topBlogsPosts.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Content" description="Blog publishing cadence, traffic, and downstream conversions." />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <ChartCardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (isError || !data || !trafficData || !topBlogsData) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Content" description="Blog publishing cadence, traffic, and downstream conversions." />
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-16 text-sm text-muted-foreground">
          Need to fetch data
        </div>
      </div>
    );
  }

  const cards: KpiMetric[] = [
    sumSeriesKpi("blogs-published", "Blogs Published", "number", data.charts.blogsPublished),
    data.kpis.blogVisitors,
    averageSeriesKpi("avg-reading-time", "Average Reading Time", "duration", data.charts.avgReadingTimeSec),
    data.kpis.contentConversions,
  ];

  const trafficByBlog = trafficData.data.map((post) => ({ name: post.title, value: post.visitors }));

  return (
    <div className="space-y-6">
      <SectionHeader title="Content" description="Blog publishing cadence, traffic, and downstream conversions." />
      <SyncStatusBanner integration="blog" label="Content" />

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
              data={data.charts.blogVisitors.current}
              previousData={data.charts.blogVisitors.previous}
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
          {({ height }) => <AppDonutChart data={data.tables.topCategories} height={height} valueFormatter={formatCompactNumber} />}
        </ChartCard>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Top Blogs</h3>
        <DataTable columns={topBlogsColumns} data={topBlogsData.data} searchPlaceholder="Search blogs…" exportFilename="top-blogs" />
      </div>
    </div>
  );
}
