"use client";

import { SectionHeader } from "@/components/primitives/section-header";
import { ChartCard } from "@/components/primitives/chart-card";
import { KpiCard } from "@/components/primitives/kpi-card";
import { ErrorState } from "@/components/primitives/error-state";
import { KpiCardSkeleton } from "@/components/primitives/skeletons/kpi-card-skeleton";
import { ChartCardSkeleton } from "@/components/primitives/skeletons/chart-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLineChart } from "@/components/charts/line-chart";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { useTwitterOverview } from "@/lib/hooks/queries/use-twitter-overview";
import type { KpiFormat, KpiMetric, TimeSeriesPoint } from "@/lib/mock-data/types";
import { formatCompactNumber, formatPercent } from "@/lib/utils/format";

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

export function TwitterPageContent() {
  const { days } = useDateRange();
  const { data, isLoading, isError, refetch } = useTwitterOverview({ days });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Twitter / X" description="Audience growth, engagement, and reach on Twitter/X." />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-medium">Top Tweets</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
                <div className="mt-3 flex gap-4">
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-3.5 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Twitter / X" description="Audience growth, engagement, and reach on Twitter/X." />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  const cards: KpiMetric[] = [
    data.kpis.followers,
    sumSeriesKpi("follower-growth", "Follower Growth", "number", data.charts.newFollowers),
    sumSeriesKpi("mentions", "Mentions", "number", data.charts.mentions),
    sumSeriesKpi("profile-visits", "Profile Visits", "compact", data.charts.profileVisits),
    data.kpis.engagementRate,
    sumSeriesKpi("link-clicks", "Link Clicks", "compact", data.charts.linkClicks),
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Twitter / X" description="Audience growth, engagement, and reach on Twitter/X." />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((metric) => (
          <KpiCard key={metric.id} metric={metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Follower Growth">
          {({ compare, height }) => (
            <AppLineChart
              data={data.charts.followers.current}
              previousData={data.charts.followers.previous}
              compare={compare}
              height={height}
              seriesLabel="Followers"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>
        <ChartCard title="Engagement Rate" showCompareControl={false}>
          {({ height }) => (
            <AppLineChart
              data={data.kpis.engagementRate.series}
              height={height}
              seriesLabel="Engagement Rate"
              valueFormatter={(v) => formatPercent(v)}
            />
          )}
        </ChartCard>
        <ChartCard title="Mention Trend" className="lg:col-span-2">
          {({ compare, height }) => (
            <AppLineChart
              data={data.charts.mentions.current}
              previousData={data.charts.mentions.previous}
              compare={compare}
              height={height}
              seriesLabel="Mentions"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Top Tweets</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {data.tables.topTweets.map((tweet) => (
            <div key={tweet.text} className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm">{tweet.text}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>{formatCompactNumber(tweet.impressions)} impressions</span>
                <span>{formatCompactNumber(tweet.likes)} likes</span>
                <span>{formatCompactNumber(tweet.reposts)} reposts</span>
                <span>{formatCompactNumber(tweet.replies)} replies</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
