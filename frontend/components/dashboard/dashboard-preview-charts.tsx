"use client";

import Link from "next/link";
import { ChartCard } from "@/components/primitives/chart-card";
import { ChartCardSkeleton } from "@/components/primitives/skeletons/chart-card-skeleton";
import { AppLineChart } from "@/components/charts/line-chart";
import { AppAreaChart } from "@/components/charts/area-chart";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { useDashboardOverview } from "@/lib/hooks/queries/use-dashboard-overview";
import { formatCompactNumber } from "@/lib/utils/format";

export function DashboardPreviewCharts() {
  const { days } = useDateRange();
  const { data, isLoading, isError } = useDashboardOverview({ days });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Trends at a glance</h2>
        <Link href="/website" className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          View full analytics
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ChartCardSkeleton height={200} />
          <ChartCardSkeleton height={200} />
          <ChartCardSkeleton height={200} />
        </div>
      ) : isError || !data ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-16 text-sm text-muted-foreground">
          Need to fetch data
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ChartCard title="Website Visitors" height={200} dialogHeight={400}>
            {({ compare, height }) => (
              <AppLineChart
                data={data.previewCharts.visitors.current}
                previousData={data.previewCharts.visitors.previous}
                compare={compare}
                height={height}
                seriesLabel="Visitors"
                valueFormatter={formatCompactNumber}
                showBrush={false}
              />
            )}
          </ChartCard>
          <ChartCard title="Organic Search Clicks" height={200} dialogHeight={400}>
            {({ compare, height }) => (
              <AppAreaChart
                data={data.previewCharts.organicClicks.current}
                previousData={data.previewCharts.organicClicks.previous}
                compare={compare}
                height={height}
                seriesLabel="Clicks"
                valueFormatter={formatCompactNumber}
                showBrush={false}
              />
            )}
          </ChartCard>
          <ChartCard title="Backlinks" height={200} dialogHeight={400}>
            {({ compare, height }) => (
              <AppLineChart
                data={data.previewCharts.backlinks.current}
                previousData={data.previewCharts.backlinks.previous}
                compare={compare}
                height={height}
                seriesLabel="Backlinks"
                valueFormatter={formatCompactNumber}
                showBrush={false}
              />
            )}
          </ChartCard>
        </div>
      )}
    </div>
  );
}
