"use client";

import { Gauge } from "lucide-react";
import { SyncStatusBanner } from "@/components/primitives/sync-status-banner";
import { EmptyState } from "@/components/primitives/empty-state";
import { useGscCoreWebVitals } from "@/lib/hooks/queries/use-gsc";
import type { CruxSummary } from "@/lib/api/search-console";

/** p75 field metrics from CrUX carry different units: LCP/TTFB in ms, INP in ms, CLS unitless. */
function formatMetric(kind: "lcp" | "inp" | "cls" | "ttfb", value: number | null): string {
  if (value == null) return "—";
  switch (kind) {
    case "lcp":
      return `${(value / 1000).toFixed(2)} s`;
    case "inp":
      return `${Math.round(value)} ms`;
    case "cls":
      return value.toFixed(2);
    case "ttfb":
      return `${Math.round(value)} ms`;
  }
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function FormFactorCard({ title, data }: { title: string; data?: CruxSummary }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h3 className="text-sm font-medium">{title}</h3>
      {!data ? (
        <p className="mt-4 text-xs text-muted-foreground">No data</p>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm tabular-nums">
            <span className="text-success">{data.buckets.good} good</span>
            <span className="text-warning">{data.buckets.needsImprovement} need work</span>
            <span className="text-danger">{data.buckets.poor} poor</span>
          </div>
          {data.origin ? (
            <div className="space-y-1.5 border-t border-border pt-3">
              <MetricRow label="LCP (p75)" value={formatMetric("lcp", data.origin.lcpP75)} />
              <MetricRow label="INP (p75)" value={formatMetric("inp", data.origin.inpP75)} />
              <MetricRow label="CLS (p75)" value={formatMetric("cls", data.origin.clsP75)} />
              <MetricRow label="TTFB (p75)" value={formatMetric("ttfb", data.origin.ttfbP75)} />
            </div>
          ) : (
            <p className="border-t border-border pt-3 text-xs text-muted-foreground">
              No field metrics available for this form factor.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function GscCoreWebVitals() {
  const { data, isLoading } = useGscCoreWebVitals();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SyncStatusBanner integration="gsc" label="Search Console" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-52 animate-pulse rounded-xl border border-border bg-card" />
          <div className="h-52 animate-pulse rounded-xl border border-border bg-card" />
        </div>
      </div>
    );
  }

  const phone = data?.formFactors.find((f) => f.formFactor === "phone");
  const desktop = data?.formFactors.find((f) => f.formFactor === "desktop");

  const bothMissing = !phone && !desktop;
  const bucketSum = (f?: CruxSummary) =>
    f ? f.buckets.good + f.buckets.needsImprovement + f.buckets.poor : 0;
  const allBucketsZero = bucketSum(phone) + bucketSum(desktop) === 0;
  const bothOriginsNull = !phone?.origin && !desktop?.origin;

  if (bothMissing || (allBucketsZero && bothOriginsNull)) {
    return (
      <div className="space-y-4">
        <SyncStatusBanner integration="gsc" label="Search Console" />
        <EmptyState
          icon={Gauge}
          title="No Core Web Vitals data yet"
          description="Core Web Vitals come from the CrUX (Chrome UX Report) API on a daily schedule. Data will appear once the CrUX sync runs."
        />
      </div>
    );
  }

  const sampleDate = phone?.date ?? desktop?.date ?? null;

  return (
    <div className="space-y-4">
      <SyncStatusBanner integration="gsc" label="Search Console" />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormFactorCard title="Mobile" data={phone} />
        <FormFactorCard title="Desktop" data={desktop} />
      </div>
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Gauge className="size-3" />
        Source: CrUX (Chrome UX Report) — the same data source Search Console displays.
        {sampleDate ? ` Sample date: ${sampleDate}.` : ""}
      </p>
    </div>
  );
}
