"use client";

import { useMemo, useState } from "react";
import { SectionHeader } from "@/components/primitives/section-header";
import { ChartCard } from "@/components/primitives/chart-card";
import { KpiCard } from "@/components/primitives/kpi-card";
import { DataTable } from "@/components/primitives/data-table";
import { ErrorState } from "@/components/primitives/error-state";
import { KpiCardSkeleton } from "@/components/primitives/skeletons/kpi-card-skeleton";
import { ChartCardSkeleton } from "@/components/primitives/skeletons/chart-card-skeleton";
import { TableSkeleton } from "@/components/primitives/skeletons/table-skeleton";
import { AppBarChart } from "@/components/charts/bar-chart";
import { AppDonutChart } from "@/components/charts/donut-chart";
import { AppLineChart } from "@/components/charts/line-chart";
import { buildRedditColumns } from "@/components/reddit/reddit-columns";
import { RedditDetailDrawer } from "@/components/reddit/reddit-detail-drawer";
import { useRedditMentions } from "@/lib/hooks/queries/use-reddit-mentions";
import { useUpdateRedditMention } from "@/lib/hooks/mutations/use-update-reddit-mention";
import type { RedditMentionRow, RedditSentiment, RedditMentionType } from "@/lib/api/reddit";
import { MENTION_TYPE_LABELS } from "@/lib/api/reddit";
import { formatCompactNumber } from "@/lib/utils/format";
import type { KpiMetric, TimeSeriesPoint, ShareSlice } from "@/lib/mock-data/types";

function buildMentionsTrend(rows: RedditMentionRow[]): TimeSeriesPoint[] {
  const counts: Record<string, number> = {};
  for (const r of rows) {
    const date = r.mentionedAt.slice(0, 10);
    counts[date] = (counts[date] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}

function buildSentimentBreakdown(rows: RedditMentionRow[]): ShareSlice[] {
  const SENTIMENTS: RedditSentiment[] = ["Positive", "Neutral", "Negative"];
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.sentiment] = (counts[r.sentiment] ?? 0) + 1;
  return SENTIMENTS.filter((s) => (counts[s] ?? 0) > 0).map((s) => ({ name: s, value: counts[s] ?? 0 }));
}

function buildTopSubreddits(rows: RedditMentionRow[]): { name: string; value: number }[] {
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.subreddit] = (counts[r.subreddit] ?? 0) + 1;
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12)
    .map(([name, value]) => ({ name: `r/${name}`, value }));
}

function buildMentionTypes(rows: RedditMentionRow[]): ShareSlice[] {
  const TYPES: RedditMentionType[] = ["Question", "Complaint", "Comparison", "Praise", "BugReport", "FeatureRequest"];
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.mentionType] = (counts[r.mentionType] ?? 0) + 1;
  return TYPES.filter((t) => (counts[t] ?? 0) > 0).map((t) => ({ name: MENTION_TYPE_LABELS[t], value: counts[t] ?? 0 }));
}

function buildKpis(rows: RedditMentionRow[], trend: TimeSeriesPoint[]): KpiMetric[] {
  const total = rows.length;
  const newCount = rows.filter((r) => r.status === "New").length;
  const highPriority = rows.filter((r) => r.priority === "High" || r.priority === "Critical").length;
  const positiveCount = rows.filter((r) => r.sentiment === "Positive").length;
  const sentimentScore = total === 0 ? 0 : Math.round((positiveCount / total) * 100);

  const half = Math.ceil(trend.length / 2);
  const currentHalf = trend.slice(half);
  const prevHalf = trend.slice(0, half);
  const sumValues = (pts: TimeSeriesPoint[]) => pts.reduce((a, p) => a + p.value, 0);
  const currTotal = sumValues(currentHalf);
  const prevTotal = sumValues(prevHalf);
  const trendDelta = prevTotal === 0 ? 0 : Number((((currTotal - prevTotal) / prevTotal) * 100).toFixed(1));

  return [
    {
      id: "total-mentions",
      label: "Total Mentions",
      value: total,
      format: "compact",
      deltaPct: trendDelta,
      positiveIsGood: true,
      series: trend,
    },
    {
      id: "new-mentions",
      label: "Awaiting Response",
      value: newCount,
      format: "number",
      deltaPct: 0,
      positiveIsGood: false,
      series: trend,
    },
    {
      id: "high-priority",
      label: "High / Critical Priority",
      value: highPriority,
      format: "number",
      deltaPct: 0,
      positiveIsGood: false,
      series: trend,
    },
    {
      id: "positive-sentiment",
      label: "Positive Sentiment",
      value: sentimentScore,
      format: "percent",
      deltaPct: 0,
      positiveIsGood: true,
      series: trend,
    },
  ];
}

export function RedditPageContent() {
  const { data, isLoading, isError, refetch } = useRedditMentions();
  const updateMention = useUpdateRedditMention();
  const [selectedRow, setSelectedRow] = useState<RedditMentionRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const rows = useMemo(() => data?.data ?? [], [data]);

  const trend = useMemo(() => buildMentionsTrend(rows), [rows]);
  const sentimentBreakdown = useMemo(() => buildSentimentBreakdown(rows), [rows]);
  const topSubreddits = useMemo(() => buildTopSubreddits(rows), [rows]);
  const mentionTypes = useMemo(() => buildMentionTypes(rows), [rows]);
  const kpis = useMemo(() => buildKpis(rows, trend), [rows, trend]);

  const selectedRowLatest = useMemo(
    () => (selectedRow ? rows.find((r) => r.id === selectedRow.id) ?? selectedRow : null),
    [rows, selectedRow]
  );

  const columns = useMemo(
    () =>
      buildRedditColumns((row, action) => {
        if (action === "view" || action === "assign") {
          setSelectedRow(row);
          setDrawerOpen(true);
          return;
        }
        if (action === "resolve") {
          updateMention.mutate({ id: row.id, patch: { status: "Resolved" } });
        }
      }),
    [updateMention]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Reddit Intelligence"
          description="Triage and analyze HydraDB mentions across Reddit."
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>
        <TableSkeleton rows={10} columns={9} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Reddit Intelligence"
          description="Triage and analyze HydraDB mentions across Reddit."
        />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  const newCount = rows.filter((r) => r.status === "New").length;
  const highPriorityCount = rows.filter((r) => r.priority === "High" || r.priority === "Critical").length;
  const unresolvedCount = rows.filter((r) => r.status !== "Resolved" && r.status !== "Ignored").length;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Reddit Intelligence"
        description="Monitor brand mentions, track sentiment, and triage community conversations across Reddit."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((metric) => (
          <KpiCard key={metric.id} metric={metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Mention Volume Over Time" showCompareControl={false} className="lg:col-span-2">
          {({ height }) => (
            <AppLineChart
              data={trend}
              height={height}
              seriesLabel="Mentions"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>

        <ChartCard title="Top Subreddits" showCompareControl={false}>
          {({ height }) => (
            <AppBarChart
              data={topSubreddits}
              height={height}
              layout="horizontal"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>

        <ChartCard title="Sentiment Breakdown" showCompareControl={false}>
          {({ height }) => (
            <AppDonutChart
              data={sentimentBreakdown}
              height={height}
              valueFormatter={(v) => `${v} mentions`}
            />
          )}
        </ChartCard>

        <ChartCard title="Mention Types" showCompareControl={false} className="lg:col-span-2">
          {({ height }) => (
            <AppBarChart
              data={mentionTypes}
              height={height}
              layout="vertical"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-medium">All Mentions</h3>
          <span className="rounded-full border border-border bg-secondary/40 px-3 py-0.5 text-xs">{newCount} New</span>
          <span className="rounded-full border border-border bg-danger/10 px-3 py-0.5 text-xs text-danger">{highPriorityCount} High Priority</span>
          <span className="rounded-full border border-border bg-secondary/40 px-3 py-0.5 text-xs">{unresolvedCount} Unresolved</span>
        </div>
        <DataTable
          columns={columns}
          data={rows}
          searchPlaceholder="Search posts, authors, subreddits…"
          exportFilename="reddit-mentions"
          onRowClick={(row) => {
            setSelectedRow(row);
            setDrawerOpen(true);
          }}
          maxHeight={560}
          emptyTitle="No mentions match your filters"
          emptyDescription="Try clearing your search or adjusting filters."
        />
      </div>

      {selectedRowLatest && (
        <RedditDetailDrawer key={selectedRowLatest.id} row={selectedRowLatest} open={drawerOpen} onOpenChange={setDrawerOpen} />
      )}
    </div>
  );
}
