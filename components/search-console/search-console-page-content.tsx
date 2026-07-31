"use client";

import { SectionHeader } from "@/components/primitives/section-header";
import { ChartCard } from "@/components/primitives/chart-card";
import { ErrorState } from "@/components/primitives/error-state";
import { ChartCardSkeleton } from "@/components/primitives/skeletons/chart-card-skeleton";
import { AppLineChart } from "@/components/charts/line-chart";
import { AppAreaChart } from "@/components/charts/area-chart";
import { SearchConsoleTables } from "@/components/search-console/search-console-tables";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { useSearchConsoleOverview } from "@/lib/hooks/queries/use-search-console-overview";
import { formatCompactNumber, formatPercent } from "@/lib/utils/format";

export function SearchConsolePageContent() {
  const { days } = useDateRange();
  const { data, isLoading, isError, refetch } = useSearchConsoleOverview({ days });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Google Search Console" description="Organic search visibility as reported by Search Console." />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <ChartCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Google Search Console" description="Organic search visibility as reported by Search Console." />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Google Search Console" description="Organic search visibility as reported by Search Console." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Clicks">
          {({ compare, height }) => (
            <AppAreaChart
              data={data.charts.clicks.current}
              previousData={data.charts.clicks.previous}
              compare={compare}
              height={height}
              seriesLabel="Clicks"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>
        <ChartCard title="Impressions">
          {({ compare, height }) => (
            <AppAreaChart
              data={data.charts.impressions.current}
              previousData={data.charts.impressions.previous}
              compare={compare}
              height={height}
              seriesLabel="Impressions"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>
        <ChartCard title="CTR">
          {({ compare, height }) => (
            <AppLineChart
              data={data.charts.ctr.current}
              previousData={data.charts.ctr.previous}
              compare={compare}
              height={height}
              seriesLabel="CTR"
              valueFormatter={(v) => formatPercent(v)}
            />
          )}
        </ChartCard>
        <ChartCard title="Average Position">
          {({ compare, height }) => (
            <AppLineChart
              data={data.charts.avgPosition.current}
              previousData={data.charts.avgPosition.previous}
              compare={compare}
              height={height}
              seriesLabel="Avg Position"
              valueFormatter={(v) => `#${v.toFixed(1)}`}
            />
          )}
        </ChartCard>
      </div>

      <SearchConsoleTables tables={data.tables} />
    </div>
  );
}
