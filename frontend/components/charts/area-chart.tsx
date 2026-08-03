"use client";

import { useState } from "react";
import { Area, AreaChart as RechartsAreaChart, CartesianGrid, XAxis, YAxis, Brush } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { AppChartTooltip } from "@/components/primitives/chart-tooltip";
import { InteractiveLegend, type LegendItem } from "@/components/primitives/chart-legend";
import { mergeCompareSeries } from "@/lib/utils/chart-data";
import { formatDateShort } from "@/lib/utils/format";
import type { TimeSeriesPoint } from "@/lib/mock-data/types";

export function AppAreaChart({
  data,
  previousData,
  compare,
  height,
  seriesLabel = "Value",
  valueFormatter = (v: number) => v.toLocaleString(),
  showBrush = true,
}: {
  data: TimeSeriesPoint[];
  previousData?: TimeSeriesPoint[];
  compare?: boolean;
  height: number;
  seriesLabel?: string;
  valueFormatter?: (value: number) => string;
  showBrush?: boolean;
}) {
  const showCompare = Boolean(compare && previousData && previousData.length > 0);
  const chartData = showCompare
    ? mergeCompareSeries(data, previousData!)
    : data.map((d) => ({ date: d.date, current: d.value }));
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const legendItems: LegendItem[] = [
    { key: "current", label: seriesLabel, color: "var(--chart-1)" },
    ...(showCompare ? [{ key: "previous", label: "Previous period", color: "var(--chart-3)", dashed: true }] : []),
  ];

  return (
    <div>
      <ChartContainer config={{}} style={{ height }} className="w-full">
        <RechartsAreaChart data={chartData} margin={{ left: 4, right: 8, top: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(v) => formatDateShort(new Date(v))}
            minTickGap={32}
          />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} width={44} tickFormatter={valueFormatter} />
          <ChartTooltip content={<AppChartTooltip valueFormatter={valueFormatter} />} />
          {!hidden.has("current") && (
            <Area
              type="monotone"
              dataKey="current"
              name={seriesLabel}
              stroke="var(--chart-1)"
              fill="var(--chart-1)"
              fillOpacity={0.12}
              strokeWidth={2}
              isAnimationActive={false}
            />
          )}
          {showCompare && !hidden.has("previous") && (
            <Area
              type="monotone"
              dataKey="previous"
              name="Previous period"
              stroke="var(--chart-3)"
              fill="var(--chart-3)"
              fillOpacity={0.06}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              isAnimationActive={false}
            />
          )}
          {showBrush && chartData.length > 10 && (
            <Brush
              dataKey="date"
              height={20}
              stroke="var(--border)"
              travellerWidth={8}
              tickFormatter={(v) => formatDateShort(new Date(v))}
            />
          )}
        </RechartsAreaChart>
      </ChartContainer>
      <InteractiveLegend items={legendItems} hidden={hidden} onToggle={toggle} />
    </div>
  );
}
