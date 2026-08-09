"use client";

import Link from "next/link";
import { ArrowRight, FileText, Globe, Search } from "lucide-react";
import { Sparkline } from "@/components/primitives/sparkline";
import { StatTrendBadge } from "@/components/primitives/stat-trend-badge";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { SyncStatusBanner } from "@/components/primitives/sync-status-banner";
import { KpiCardSkeleton } from "@/components/primitives/skeletons/kpi-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { useGscParams } from "@/lib/hooks/use-gsc-params";
import { useGscSummary, useGscTimeseries, useGscDimension } from "@/lib/hooks/queries/use-gsc";
import { formatCompactNumber, formatNumber, formatPercent, truncateLabel } from "@/lib/utils/format";
import type { MetricSummary, GscSeriesPoint } from "@/lib/api/search-console";
import { GscNoProperty } from "./gsc-no-property";

/** Big number + delta + sparkline. Mirrors GSC Insights' headline stat tiles. */
function StatTile({
  label,
  metric,
  series,
}: {
  label: string;
  metric: MetricSummary;
  series: { date: string; value: number }[];
}) {
  const positive = (metric.deltaPct ?? 0) >= 0;
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {metric.deltaPct !== null && <StatTrendBadge deltaPct={metric.deltaPct} />}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{formatCompactNumber(metric.value)}</p>
      {series.length > 0 && (
        <div className="mt-3">
          <Sparkline data={series} positive={positive} />
        </div>
      )}
    </div>
  );
}

/** Card shell matching the section's visual language, with an optional "view more" link. */
function Card({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        {href && linkLabel && (
          <Link href={href} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            {linkLabel}
            <ArrowRight className="size-3" />
          </Link>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center justify-between py-2">
      <Skeleton className="h-3.5 w-40" />
      <Skeleton className="h-3.5 w-10" />
    </div>
  );
}

export function GscInsights() {
  const params = useGscParams();
  const query = { property: params.property, searchType: params.searchType, days: params.days, compare: params.compareMode };

  const summary = useGscSummary(query);
  const timeseries = useGscTimeseries({ ...query, granularity: "daily" });
  const topPages = useGscDimension("page", { ...query, pageSize: 5, sort: "clicks:desc" });
  const topQueries = useGscDimension("query", { ...query, pageSize: 5, sort: "clicks:desc" });
  const topCountries = useGscDimension("country", { ...query, pageSize: 5, sort: "clicks:desc" });

  if (summary.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </div>
      </div>
    );
  }

  if (!summary.data?.summary) {
    return <GscNoProperty />;
  }

  const s = summary.data.summary;
  const points: GscSeriesPoint[] = timeseries.data?.current ?? [];
  const clicksSeries = points.map((p) => ({ date: p.date, value: p.clicks }));
  const impressionsSeries = points.map((p) => ({ date: p.date, value: p.impressions }));
  const totalClicks = s.clicks.value;

  return (
    <div className="space-y-4">
      <SyncStatusBanner integration="gsc" label="Search Console" />
      {s.provisional && (
        <p className="text-xs text-muted-foreground">
          The most recent days are provisional and may be revised by Google.
        </p>
      )}

      {/* Headline stat tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatTile label="Clicks" metric={s.clicks} series={clicksSeries} />
        <StatTile label="Impressions" metric={s.impressions} series={impressionsSeries} />
      </div>

      {/* Your content — top pages by clicks */}
      <Card title="Your content" href="/search-console/performance" linkLabel="View more">
        {topPages.isLoading ? (
          <div className="divide-y divide-border">
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </div>
        ) : topPages.isError ? (
          <ErrorState onRetry={() => topPages.refetch()} />
        ) : (topPages.data?.rows.length ?? 0) === 0 ? (
          <EmptyState icon={FileText} title="No page data yet" description="Top pages appear once Search Console performance data has synced." />
        ) : (
          <ul className="divide-y divide-border">
            {topPages.data!.rows.map((row) => (
              <li key={row.value} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate text-muted-foreground" title={row.value}>
                  {truncateLabel(row.value, 48)}
                </span>
                <span className="shrink-0 tabular-nums font-medium">{formatNumber(row.clicks)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Queries leading to your site */}
      <Card title="Queries leading to your site" href="/search-console/performance" linkLabel="View more">
        {topQueries.isLoading ? (
          <div className="divide-y divide-border">
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </div>
        ) : topQueries.isError ? (
          <ErrorState onRetry={() => topQueries.refetch()} />
        ) : (topQueries.data?.rows.length ?? 0) === 0 ? (
          <EmptyState icon={Search} title="No query data yet" description="Search queries appear once Search Console performance data has synced." />
        ) : (
          <ul className="divide-y divide-border">
            {topQueries.data!.rows.map((row) => (
              <li key={row.value} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate text-muted-foreground" title={row.value}>
                  {truncateLabel(row.value, 48)}
                </span>
                <span className="shrink-0 tabular-nums font-medium">{formatNumber(row.clicks)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Top countries — share of clicks */}
      <Card title="Top countries">
        {topCountries.isLoading ? (
          <div className="space-y-3">
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </div>
        ) : topCountries.isError ? (
          <ErrorState onRetry={() => topCountries.refetch()} />
        ) : (topCountries.data?.rows.length ?? 0) === 0 ? (
          <EmptyState icon={Globe} title="No country data yet" description="Country breakdowns appear once Search Console performance data has synced." />
        ) : (
          <ul className="space-y-3">
            {topCountries.data!.rows.map((row) => {
              const pct = totalClicks > 0 ? (row.clicks / totalClicks) * 100 : 0;
              return (
                <li key={row.value}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="uppercase">{row.value}</span>
                    <span className="tabular-nums text-muted-foreground">{formatNumber(row.clicks)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {formatPercent(pct, 0)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <p className="text-[11px] text-muted-foreground">
        These are your top items by clicks for the selected period. Per-row trending (up/down vs. the comparison
        period) requires row-level comparison data, which isn&apos;t available yet.
      </p>
    </div>
  );
}
