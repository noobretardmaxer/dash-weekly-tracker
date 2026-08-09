"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SyncStatusBanner } from "@/components/primitives/sync-status-banner";
import { ChartCardSkeleton } from "@/components/primitives/skeletons/chart-card-skeleton";
import { EmptyState } from "@/components/primitives/empty-state";
import { useGscParams } from "@/lib/hooks/use-gsc-params";
import { useGscSummary, useGscTimeseries } from "@/lib/hooks/queries/use-gsc";
import { formatNumber } from "@/lib/utils/format";
import type { Granularity, GscDimension, GscSeriesPoint } from "@/lib/api/search-console";
import { GscMetricCards, type GscMetricKey } from "./gsc-metric-cards";
import { GscPerformanceChart } from "./gsc-performance-chart";
import { GscDimensionTable } from "./gsc-dimension-table";
import { GscNoProperty } from "./gsc-no-property";

const DIMENSION_TABS: { value: GscDimension; label: string; valueLabel: string }[] = [
  { value: "query", label: "Queries", valueLabel: "Query" },
  { value: "page", label: "Pages", valueLabel: "Page" },
  { value: "country", label: "Countries", valueLabel: "Country" },
  { value: "device", label: "Devices", valueLabel: "Device" },
  { value: "search_appearance", label: "Search Appearance", valueLabel: "Appearance" },
];

const GRANULARITIES: Granularity[] = ["daily", "weekly", "monthly"];

function DatesTable({ rows }: { rows: GscSeriesPoint[] }) {
  if (!rows.length) return <EmptyState title="No data" description="No data for the selected range." />;
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="max-h-[440px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="bg-card hover:bg-card">
              <TableHead className="bg-card">Date</TableHead>
              <TableHead className="bg-card text-right">Clicks</TableHead>
              <TableHead className="bg-card text-right">Impressions</TableHead>
              <TableHead className="bg-card text-right">CTR</TableHead>
              <TableHead className="bg-card text-right">Position</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...rows].reverse().map((r) => (
              <TableRow key={r.date}>
                <TableCell>{r.date}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(r.clicks)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(r.impressions)}</TableCell>
                <TableCell className="text-right tabular-nums">{(r.ctr * 100).toFixed(1)}%</TableCell>
                <TableCell className="text-right tabular-nums">{r.position.toFixed(1)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function GscPerformance() {
  const params = useGscParams();
  const query = { property: params.property, searchType: params.searchType, days: params.days, compare: params.compareMode };
  const summary = useGscSummary(query);
  const timeseries = useGscTimeseries({ ...query, granularity: params.granularity });
  const [selected, setSelected] = useState<Set<GscMetricKey>>(new Set(["clicks", "impressions"]));

  const toggle = (key: GscMetricKey) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key); // keep at least one series on the chart
      } else {
        next.add(key);
      }
      return next;
    });

  if (summary.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
        <ChartCardSkeleton />
      </div>
    );
  }

  if (!summary.data?.summary) return <GscNoProperty />;

  return (
    <div className="space-y-4">
      <SyncStatusBanner integration="gsc" label="Search Console" />
      <GscMetricCards summary={summary.data.summary} selected={selected} onToggle={toggle} />

      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-end gap-1">
          {GRANULARITIES.map((g) => (
            <button
              key={g}
              onClick={() => params.setGranularity(g)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs capitalize transition-colors",
                params.granularity === g ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {g}
            </button>
          ))}
        </div>
        {timeseries.isLoading ? (
          <div className="h-[320px] animate-pulse rounded-md bg-muted/40" />
        ) : (
          <GscPerformanceChart data={timeseries.data?.current ?? []} selected={selected} />
        )}
      </div>

      <Tabs defaultValue="query">
        <TabsList className="flex-wrap">
          {DIMENSION_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="dates">Dates</TabsTrigger>
        </TabsList>
        {DIMENSION_TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-4">
            <GscDimensionTable dimension={t.value} valueLabel={t.valueLabel} params={query} />
          </TabsContent>
        ))}
        <TabsContent value="dates" className="mt-4">
          <DatesTable rows={timeseries.data?.current ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
