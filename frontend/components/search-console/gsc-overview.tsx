"use client";

import Link from "next/link";
import { ArrowRight, Gauge, ListChecks } from "lucide-react";
import { AppLineChart } from "@/components/charts/line-chart";
import { SyncStatusBanner } from "@/components/primitives/sync-status-banner";
import { ChartCardSkeleton } from "@/components/primitives/skeletons/chart-card-skeleton";
import { useGscParams } from "@/lib/hooks/use-gsc-params";
import { useGscSummary, useGscTimeseries, useGscIndexStatus, useGscCoreWebVitals } from "@/lib/hooks/queries/use-gsc";
import { formatCompactNumber, formatNumber } from "@/lib/utils/format";
import { GscNoProperty } from "./gsc-no-property";
import { formatGscMetric } from "./gsc-metric-cards";

function Card({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <Link href={href} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          {linkLabel}
          <ArrowRight className="size-3" />
        </Link>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function BucketRow({ label, buckets }: { label: string; buckets: { good: number; needsImprovement: number; poor: number } }) {
  const empty = buckets.good + buckets.needsImprovement + buckets.poor === 0;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      {empty ? (
        <span className="text-xs text-muted-foreground">No data</span>
      ) : (
        <span className="flex items-center gap-3 tabular-nums">
          <span className="text-success">{buckets.good} good</span>
          <span className="text-warning">{buckets.needsImprovement} need work</span>
          <span className="text-danger">{buckets.poor} poor</span>
        </span>
      )}
    </div>
  );
}

export function GscOverview() {
  const params = useGscParams();
  const query = { property: params.property, searchType: params.searchType, days: params.days, compare: params.compareMode };

  const summary = useGscSummary(query);
  const timeseries = useGscTimeseries({ ...query, granularity: "daily" });
  const indexStatus = useGscIndexStatus(params.property);
  const cwv = useGscCoreWebVitals();

  if (summary.isLoading) {
    return (
      <div className="space-y-4">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    );
  }

  if (!summary.data?.summary) {
    return <GscNoProperty />;
  }

  const clicksSeries = (timeseries.data?.current ?? []).map((p) => ({ date: p.date, value: p.clicks }));
  const prevClicksSeries = (timeseries.data?.previous ?? []).map((p) => ({ date: p.date, value: p.clicks }));
  const index = indexStatus.data;
  const phone = cwv.data?.formFactors.find((f) => f.formFactor === "phone");
  const desktop = cwv.data?.formFactors.find((f) => f.formFactor === "desktop");

  return (
    <div className="space-y-4">
      <SyncStatusBanner integration="gsc" label="Search Console" />
      {summary.data.summary.provisional && (
        <p className="text-xs text-muted-foreground">
          The most recent days are provisional and may be revised by Google.
        </p>
      )}

      <Card title="Performance" href="/search-console/performance" linkLabel="Full report">
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight">{formatCompactNumber(summary.data.summary.clicks.value)}</span>
          <span className="text-xs text-muted-foreground">total web search clicks</span>
        </div>
        <AppLineChart
          data={clicksSeries}
          previousData={prevClicksSeries}
          compare={params.compare}
          height={220}
          seriesLabel="Clicks"
          valueFormatter={formatCompactNumber}
        />
      </Card>

      <Card title="Indexing" href="/search-console/pages" linkLabel="View pages">
        {!index || index.total === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ListChecks className="size-4" />
            No index data yet — URL Inspection runs on a rolling schedule.
          </div>
        ) : (
          <div className="flex gap-8">
            <div>
              <p className="text-2xl font-semibold tracking-tight text-success">{formatNumber(index.indexed)}</p>
              <p className="text-xs text-muted-foreground">Indexed</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">{formatNumber(index.notIndexed)}</p>
              <p className="text-xs text-muted-foreground">Not indexed</p>
            </div>
          </div>
        )}
      </Card>

      <Card title="Experience — Core Web Vitals" href="/search-console/core-web-vitals" linkLabel="View report">
        <div className="space-y-2">
          <BucketRow label="Mobile" buckets={phone?.buckets ?? { good: 0, needsImprovement: 0, poor: 0 }} />
          <BucketRow label="Desktop" buckets={desktop?.buckets ?? { good: 0, needsImprovement: 0, poor: 0 }} />
          <p className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
            <Gauge className="size-3" />
            Source: CrUX (Chrome UX Report), same as Search Console.
          </p>
        </div>
      </Card>
    </div>
  );
}
