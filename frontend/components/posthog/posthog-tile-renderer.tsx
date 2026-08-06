"use client";

import { useMemo } from "react";
import type { PostHogTile } from "@/lib/api/posthog-dashboards";
import { ChartCard } from "@/components/primitives/chart-card";
import { SectionHeader } from "@/components/primitives/section-header";
import { AppLineChart } from "@/components/charts/line-chart";
import { AppBarChart } from "@/components/charts/bar-chart";
import { AppDonutChart } from "@/components/charts/donut-chart";
import { AppFunnelChart } from "@/components/charts/funnel-chart";
import { AppStackedBarChart } from "@/components/charts/stacked-bar-chart";
import { DataTable } from "@/components/primitives/data-table";
import { cn } from "@/lib/utils";
import {
  parseBoldNumber,
  parseTimeSeries,
  parsePieData,
  parseBarData,
  parseFunnelData,
  parseLifecycleData,
  parseTrendsTable,
  parseHogQLTable,
  getDisplayType,
  getSourceKind,
} from "./transform-utils";

function formatCompact(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString();
}

// ---------------------------------------------------------------------------
// Text tile → section header
// ---------------------------------------------------------------------------

function TextTile({ body }: { body: string }) {
  const headingMatch = body.match(/^##?\s*(?:[\p{Emoji}‍️]+\s*)?(.+)/mu);
  const title = headingMatch?.[1]?.trim() ?? "";
  const descLines = body
    .split("\n")
    .filter((l) => !l.startsWith("#") && l.trim().length > 0);
  const description = descLines.join(" ").trim();

  if (!title && !description) return null;
  return <SectionHeader title={title} description={description} />;
}

// ---------------------------------------------------------------------------
// Bold Number (KPI-style)
// ---------------------------------------------------------------------------

function BoldNumberTile({ tile }: { tile: PostHogTile }) {
  const insight = tile.insight!;
  const { value, deltaPct } = useMemo(() => parseBoldNumber(insight.result), [insight.result]);

  const formattedValue = formatCompact(value);
  const hasDelta = deltaPct != null && isFinite(deltaPct);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-1 text-sm font-medium text-muted-foreground">{insight.name}</div>
      {insight.description && (
        <div className="mb-3 text-xs text-muted-foreground/70">{insight.description}</div>
      )}
      <div className="text-3xl font-bold tracking-tight">{formattedValue}</div>
      {hasDelta && (
        <div
          className={cn(
            "mt-1 text-sm font-medium",
            deltaPct! > 0 ? "text-emerald-600" : deltaPct! < 0 ? "text-red-500" : "text-muted-foreground"
          )}
        >
          {deltaPct! > 0 ? "↑" : deltaPct! < 0 ? "↓" : ""}{" "}
          {Math.abs(deltaPct!).toFixed(1)}% from previous period
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Line chart tile
// ---------------------------------------------------------------------------

function LineChartTile({ tile }: { tile: PostHogTile }) {
  const insight = tile.insight!;
  const { series } = useMemo(() => parseTimeSeries(insight.result), [insight.result]);

  if (series.length === 0) return <EmptyTile name={insight.name} />;

  if (series.length === 1) {
    return (
      <ChartCard title={insight.name} description={insight.description} showCompareControl={false}>
        {({ height }) => (
          <AppLineChart
            data={series[0].data}
            height={height}
            seriesLabel={series[0].label}
            valueFormatter={formatCompact}
            showBrush={false}
          />
        )}
      </ChartCard>
    );
  }

  // Multi-series: merge into a single data array for a multi-line chart
  return (
    <ChartCard title={insight.name} description={insight.description} showCompareControl={false}>
      {({ height }) => <MultiLineChart series={series} height={height} />}
    </ChartCard>
  );
}

function MultiLineChart({
  series,
  height,
}: {
  series: { key: string; label: string; data: { date: string; value: number }[] }[];
  height: number;
}) {
  // For multi-series, we use the first series as the primary and second as "previous"
  // since AppLineChart supports compare mode with two series
  if (series.length === 2) {
    return (
      <AppLineChart
        data={series[0].data}
        previousData={series[1].data}
        compare={true}
        height={height}
        seriesLabel={series[0].label}
        valueFormatter={formatCompact}
        showBrush={false}
      />
    );
  }

  // For 3+ series, just show the first one (rare case)
  return (
    <AppLineChart
      data={series[0].data}
      height={height}
      seriesLabel={series[0].label}
      valueFormatter={formatCompact}
      showBrush={false}
    />
  );
}

// ---------------------------------------------------------------------------
// Bar chart tile
// ---------------------------------------------------------------------------

function BarChartTile({ tile, horizontal }: { tile: PostHogTile; horizontal: boolean }) {
  const insight = tile.insight!;
  const data = useMemo(() => parseBarData(insight.result), [insight.result]);

  if (data.length === 0) return <EmptyTile name={insight.name} />;

  const dynamicHeight = horizontal ? Math.max(260, data.length * 28) : 260;

  return (
    <ChartCard title={insight.name} description={insight.description} showCompareControl={false} height={dynamicHeight}>
      {({ height }) => (
        <AppBarChart
          data={data}
          height={height}
          layout={horizontal ? "horizontal" : "vertical"}
          valueFormatter={formatCompact}
        />
      )}
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------
// Pie / donut tile
// ---------------------------------------------------------------------------

function PieTile({ tile }: { tile: PostHogTile }) {
  const insight = tile.insight!;
  const data = useMemo(() => parsePieData(insight.result), [insight.result]);

  if (data.length === 0) return <EmptyTile name={insight.name} />;

  return (
    <ChartCard title={insight.name} description={insight.description} showCompareControl={false}>
      {({ height }) => (
        <AppDonutChart data={data} height={height} valueFormatter={formatCompact} />
      )}
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------
// Funnel tile
// ---------------------------------------------------------------------------

function FunnelTile({ tile }: { tile: PostHogTile }) {
  const insight = tile.insight!;
  const data = useMemo(() => parseFunnelData(insight.result), [insight.result]);

  if (data.length === 0) return <EmptyTile name={insight.name} />;

  return (
    <ChartCard title={insight.name} description={insight.description} showCompareControl={false}>
      {({ height }) => (
        <AppFunnelChart
          data={data}
          height={height}
          valueFormatter={(v) => formatCompact(v)}
        />
      )}
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------
// Lifecycle (stacked bar) tile
// ---------------------------------------------------------------------------

function LifecycleTile({ tile }: { tile: PostHogTile }) {
  const insight = tile.insight!;
  const lifecycle = useMemo(() => parseLifecycleData(insight.result), [insight.result]);

  if (lifecycle.data.length === 0) return <EmptyTile name={insight.name} />;

  return (
    <ChartCard title={insight.name} description={insight.description} showCompareControl={false}>
      {({ height }) => (
        <AppStackedBarChart
          data={lifecycle.data}
          series={lifecycle.series}
          height={height}
          valueFormatter={formatCompact}
        />
      )}
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------
// Table tile
// ---------------------------------------------------------------------------

function TableTile({ tile, isHogQL }: { tile: PostHogTile; isHogQL: boolean }) {
  const insight = tile.insight!;
  const { columns, rows } = useMemo(
    () => (isHogQL ? parseHogQLTable(insight.result) : parseTrendsTable(insight.result)),
    [insight.result, isHogQL]
  );

  if (rows.length === 0) return <EmptyTile name={insight.name} />;

  const tableColumns = columns.map((col) => ({
    accessorKey: col.key,
    header: col.label,
    cell: ({ row }: { row: { getValue: (key: string) => unknown } }) => {
      const val = row.getValue(col.key);
      if (typeof val === "number") return formatCompact(val);
      return String(val ?? "");
    },
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 text-sm font-semibold">{insight.name}</div>
      {insight.description && (
        <div className="mb-3 text-xs text-muted-foreground">{insight.description}</div>
      )}
      <DataTable columns={tableColumns} data={rows} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty / unsupported fallbacks
// ---------------------------------------------------------------------------

function EmptyTile({ name }: { name: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-sm font-medium text-muted-foreground">{name}</div>
      <div className="mt-2 text-xs text-muted-foreground/60">No data available</div>
    </div>
  );
}

function UnsupportedTile({ name, type }: { name: string; type: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-5">
      <div className="text-sm font-medium text-muted-foreground">{name}</div>
      <div className="mt-2 text-xs text-muted-foreground/60">
        Visualization type &ldquo;{type}&rdquo; is not yet supported
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main renderer
// ---------------------------------------------------------------------------

export function PostHogTileRenderer({ tile }: { tile: PostHogTile }) {
  // Text tiles (section headers)
  if (tile.text) {
    return (
      <div className="lg:col-span-2">
        <TextTile body={tile.text.body} />
      </div>
    );
  }

  if (!tile.insight) return null;

  const query = tile.insight.query;
  const sourceKind = getSourceKind(query);
  const display = getDisplayType(query);

  // Determine grid span from layout
  const smW = tile.layouts?.sm?.w ?? 6;
  const isFullWidth = smW >= 8;
  const wrapperClass = isFullWidth ? "lg:col-span-2" : "";

  let content: React.ReactNode;

  if (sourceKind === "FunnelsQuery") {
    content = <FunnelTile tile={tile} />;
  } else if (sourceKind === "LifecycleQuery") {
    content = <LifecycleTile tile={tile} />;
  } else if (sourceKind === "HogQLQuery") {
    if (display === "BoldNumber") {
      content = <BoldNumberTile tile={tile} />;
    } else {
      content = <TableTile tile={tile} isHogQL />;
    }
  } else {
    // TrendsQuery or similar — dispatch on display type
    switch (display) {
      case "BoldNumber":
        content = <BoldNumberTile tile={tile} />;
        break;
      case "ActionsLineGraph":
      case "ActionsLineGraphCumulative":
        content = <LineChartTile tile={tile} />;
        break;
      case "ActionsPie":
        content = <PieTile tile={tile} />;
        break;
      case "ActionsBar":
        content = <BarChartTile tile={tile} horizontal={false} />;
        break;
      case "ActionsBarValue":
      case "WorldMap":
        content = <BarChartTile tile={tile} horizontal />;
        break;
      case "ActionsTable":
        content = <TableTile tile={tile} isHogQL={false} />;
        break;
      case "Funnel":
        content = <FunnelTile tile={tile} />;
        break;
      case "Lifecycle":
        content = <LifecycleTile tile={tile} />;
        break;
      default:
        content = <UnsupportedTile name={tile.insight.name} type={display} />;
    }
  }

  return <div className={wrapperClass}>{content}</div>;
}
