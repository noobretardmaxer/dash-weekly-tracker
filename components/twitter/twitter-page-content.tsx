"use client";

import { SectionHeader } from "@/components/primitives/section-header";
import { ChartCard } from "@/components/primitives/chart-card";
import { KpiCard } from "@/components/primitives/kpi-card";
import { AppLineChart } from "@/components/charts/line-chart";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { sliceLastNDays, getPreviousPeriod, buildKpiMetric } from "@/lib/mock-data/utils";
import {
  followersSeries,
  newFollowersSeries,
  mentionsSeries,
  profileVisitsSeries,
  engagementRateSeries,
  linkClicksSeries,
  topTweets,
} from "@/lib/mock-data/twitter";
import { formatCompactNumber, formatPercent } from "@/lib/utils/format";

export function TwitterPageContent() {
  const { days } = useDateRange();

  const cards = [
    buildKpiMetric({ id: "followers", label: "Followers", format: "compact", fullSeries: followersSeries, rangeDays: days, aggregate: "last" }),
    buildKpiMetric({ id: "follower-growth", label: "Follower Growth", format: "number", fullSeries: newFollowersSeries, rangeDays: days, aggregate: "sum" }),
    buildKpiMetric({ id: "mentions", label: "Mentions", format: "number", fullSeries: mentionsSeries, rangeDays: days, aggregate: "sum" }),
    buildKpiMetric({ id: "profile-visits", label: "Profile Visits", format: "compact", fullSeries: profileVisitsSeries, rangeDays: days, aggregate: "sum" }),
    buildKpiMetric({ id: "engagement", label: "Engagement Rate", format: "percent", fullSeries: engagementRateSeries, rangeDays: days, aggregate: "average" }),
    buildKpiMetric({ id: "link-clicks", label: "Link Clicks", format: "compact", fullSeries: linkClicksSeries, rangeDays: days, aggregate: "sum" }),
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
              data={sliceLastNDays(followersSeries, days)}
              previousData={getPreviousPeriod(followersSeries, days)}
              compare={compare}
              height={height}
              seriesLabel="Followers"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>
        <ChartCard title="Engagement Rate">
          {({ compare, height }) => (
            <AppLineChart
              data={sliceLastNDays(engagementRateSeries, days)}
              previousData={getPreviousPeriod(engagementRateSeries, days)}
              compare={compare}
              height={height}
              seriesLabel="Engagement Rate"
              valueFormatter={(v) => formatPercent(v)}
            />
          )}
        </ChartCard>
        <ChartCard title="Mention Trend" className="lg:col-span-2">
          {({ compare, height }) => (
            <AppLineChart
              data={sliceLastNDays(mentionsSeries, days)}
              previousData={getPreviousPeriod(mentionsSeries, days)}
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
          {topTweets.map((tweet) => (
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
