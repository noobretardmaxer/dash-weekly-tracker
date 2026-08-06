"use client";

import { useState } from "react";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { AppChartTooltip } from "@/components/primitives/chart-tooltip";
import { InteractiveLegend, type LegendItem } from "@/components/primitives/chart-legend";
import { formatDateShort } from "@/lib/utils/format";

export type StackedBarSeries = {
  key: string;
  label: string;
  color: string;
};

export function AppStackedBarChart({
  data,
  series,
  height,
  valueFormatter = (v: number) => v.toLocaleString(),
}: {
  data: Record<string, string | number>[];
  series: StackedBarSeries[];
  height: number;
  valueFormatter?: (value: number) => string;
}) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const legendItems: LegendItem[] = series.map((s) => ({
    key: s.key,
    label: s.label,
    color: s.color,
  }));

  const hasNegative = data.some((d) =>
    series.some((s) => !hidden.has(s.key) && Number(d[s.key] ?? 0) < 0)
  );

  return (
    <div>
      <ChartContainer config={{}} style={{ height }} className="w-full">
        <RechartsBarChart data={data} margin={{ left: 4, right: 12, top: 4, bottom: 24 }} stackOffset="sign">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatDateShort(new Date(v))}
            fontSize={11}
            angle={-35}
            textAnchor="end"
          />
          <YAxis tickLine={false} axisLine={false} tickFormatter={valueFormatter} fontSize={11} />
          <ChartTooltip content={<AppChartTooltip valueFormatter={valueFormatter} />} />
          {hasNegative && <ReferenceLine y={0} stroke="var(--border)" />}
          {series.map((s) =>
            hidden.has(s.key) ? null : (
              <Bar key={s.key} dataKey={s.key} stackId="stack" fill={s.color} radius={[2, 2, 0, 0]} />
            )
          )}
        </RechartsBarChart>
      </ChartContainer>
      <InteractiveLegend items={legendItems} hidden={hidden} onToggle={toggle} />
    </div>
  );
}
