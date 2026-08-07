"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ChartCard } from "@/components/primitives/chart-card";
import { KpiCard } from "@/components/primitives/kpi-card";
import { DataTable } from "@/components/primitives/data-table";
import { KpiCardSkeleton } from "@/components/primitives/skeletons/kpi-card-skeleton";
import { ChartCardSkeleton } from "@/components/primitives/skeletons/chart-card-skeleton";
import { TableSkeleton } from "@/components/primitives/skeletons/table-skeleton";
import { AppLineChart } from "@/components/charts/line-chart";
import { AppBarChart } from "@/components/charts/bar-chart";
import { EmptyState } from "@/components/primitives/empty-state";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { useBacklinksDetail } from "@/lib/hooks/queries/use-backlinks-detail";
import type { RefDomainRow, AnchorRow, TldRow } from "@/lib/api/seo";
import { formatCompactNumber } from "@/lib/utils/format";
import { Link2 } from "lucide-react";

const refDomainColumns: ColumnDef<RefDomainRow, unknown>[] = [
  { accessorKey: "domain", header: "Domain" },
  { accessorKey: "authorityScore", header: "Authority Score" },
  {
    accessorKey: "backlinksCount",
    header: "Backlinks",
    cell: ({ getValue }) => formatCompactNumber(getValue<number>()),
  },
];

const anchorColumns: ColumnDef<AnchorRow, unknown>[] = [
  { accessorKey: "anchor", header: "Anchor Text" },
  {
    accessorKey: "backlinksCount",
    header: "Backlinks",
    cell: ({ getValue }) => formatCompactNumber(getValue<number>()),
  },
  {
    accessorKey: "domainsCount",
    header: "Domains",
    cell: ({ getValue }) => formatCompactNumber(getValue<number>()),
  },
];

const tldColumns: ColumnDef<TldRow, unknown>[] = [
  { accessorKey: "tld", header: "TLD" },
  {
    accessorKey: "backlinksCount",
    header: "Backlinks",
    cell: ({ getValue }) => formatCompactNumber(getValue<number>()),
  },
  {
    accessorKey: "domainsCount",
    header: "Domains",
    cell: ({ getValue }) => formatCompactNumber(getValue<number>()),
  },
];

export function BacklinksDetail() {
  const { days } = useDateRange();
  const { data, isLoading, isError } = useBacklinksDetail({ days });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <TableSkeleton />
          <TableSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={Link2}
        title="No backlinks data yet"
        description="Data will appear after the SEMrush sync completes. Trigger a manual sync via POST /api/v1/admin/sync/semrush if this is a fresh deploy."
      />
    );
  }

  const kpis = [data.kpis.backlinks, data.kpis.referringDomains, data.kpis.newBacklinks, data.kpis.lostBacklinks];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((metric) => (
          <KpiCard key={metric.id} metric={metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Backlink Growth">
          {({ compare, height }) => (
            <AppLineChart
              data={data.charts.backlinks.current}
              previousData={data.charts.backlinks.previous}
              compare={compare}
              height={height}
              seriesLabel="Backlinks"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>
        <ChartCard title="Referring Domains by Authority Score" showCompareControl={false}>
          {({ height }) => (
            <AppBarChart
              data={data.refDomainsByAuthority.map((b) => ({ name: b.range, value: b.count }))}
              height={height}
              layout="vertical"
              valueFormatter={formatCompactNumber}
            />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-medium">Top Referring Domains</h3>
          <DataTable
            columns={refDomainColumns}
            data={data.topRefDomains}
            searchPlaceholder="Search domains…"
            exportFilename="top-referring-domains"
          />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-medium">Anchor Text Distribution</h3>
          <DataTable
            columns={anchorColumns}
            data={data.topAnchors}
            searchPlaceholder="Search anchors…"
            exportFilename="anchor-distribution"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Top TLDs</h3>
        <DataTable columns={tldColumns} data={data.topTlds} exportFilename="top-tlds" />
      </div>
    </div>
  );
}
