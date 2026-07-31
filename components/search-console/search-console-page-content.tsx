"use client";

import { SectionHeader } from "@/components/primitives/section-header";
import { ChartCard } from "@/components/primitives/chart-card";
import { AppLineChart } from "@/components/charts/line-chart";
import { AppAreaChart } from "@/components/charts/area-chart";
import { SearchConsoleTables } from "@/components/search-console/search-console-tables";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { sliceLastNDays, getPreviousPeriod } from "@/lib/mock-data/utils";
import { clicksSeries, impressionsSeries, ctrSeries, avgPositionSeries } from "@/lib/mock-data/search-console";
import { formatCompactNumber, formatPercent } from "@/lib/utils/format";

export function SearchConsolePageContent() {
  const { days } = useDateRange();

  return (
    <div className="space-y-6">
      <SectionHeader title="Google Search Console" description="Organic search visibility as reported by Search Console." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Clicks">
          {({ compare, height }) => (
            <AppAreaChart
              data={sliceLastNDays(clicksSeries, days)}
              previousData={getPreviousPeriod(clicksSeries, days)}
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
              data={sliceLastNDays(impressionsSeries, days)}
              previousData={getPreviousPeriod(impressionsSeries, days)}
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
              data={sliceLastNDays(ctrSeries, days)}
              previousData={getPreviousPeriod(ctrSeries, days)}
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
              data={sliceLastNDays(avgPositionSeries, days)}
              previousData={getPreviousPeriod(avgPositionSeries, days)}
              compare={compare}
              height={height}
              seriesLabel="Avg Position"
              valueFormatter={(v) => `#${v.toFixed(1)}`}
            />
          )}
        </ChartCard>
      </div>

      <SearchConsoleTables />
    </div>
  );
}
