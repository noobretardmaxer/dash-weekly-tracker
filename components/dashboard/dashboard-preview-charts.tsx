"use client";

import Link from "next/link";
import { ChartCard } from "@/components/primitives/chart-card";
import { AppLineChart } from "@/components/charts/line-chart";
import { AppAreaChart } from "@/components/charts/area-chart";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { sliceLastNDays, getPreviousPeriod } from "@/lib/mock-data/utils";
import { visitorsSeries } from "@/lib/mock-data/website";
import { clicksSeries } from "@/lib/mock-data/search-console";
import { backlinksSeries } from "@/lib/mock-data/seo";
import { formatCompactNumber } from "@/lib/utils/format";

export function DashboardPreviewCharts() {
  const { days } = useDateRange();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Trends at a glance</h2>
        <Link href="/website" className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          View full analytics
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Website Visitors" height={200} dialogHeight={400}>
          {({ compare, height }) => (
            <AppLineChart
              data={sliceLastNDays(visitorsSeries, days)}
              previousData={getPreviousPeriod(visitorsSeries, days)}
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
              data={sliceLastNDays(clicksSeries, days)}
              previousData={getPreviousPeriod(clicksSeries, days)}
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
              data={sliceLastNDays(backlinksSeries, days)}
              previousData={getPreviousPeriod(backlinksSeries, days)}
              compare={compare}
              height={height}
              seriesLabel="Backlinks"
              valueFormatter={formatCompactNumber}
              showBrush={false}
            />
          )}
        </ChartCard>
      </div>
    </div>
  );
}
