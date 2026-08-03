"use client";

import { useState } from "react";
import { Cell, Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { AppChartTooltip } from "@/components/primitives/chart-tooltip";
import { InteractiveLegend, type LegendItem } from "@/components/primitives/chart-legend";
import type { ShareSlice } from "@/lib/mock-data/types";

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];

export function AppDonutChart({
  data,
  height,
  valueFormatter = (v: number) => `${v}%`,
}: {
  data: ShareSlice[];
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

  const visibleData = data.filter((d) => !hidden.has(d.name));
  const legendItems: LegendItem[] = data.map((d, i) => ({
    key: d.name,
    label: d.name,
    color: PALETTE[i % PALETTE.length],
  }));

  return (
    <div>
      <ChartContainer config={{}} style={{ height }} className="w-full">
        <PieChart>
          <ChartTooltip content={<AppChartTooltip valueFormatter={valueFormatter} />} />
          <Pie
            data={visibleData}
            dataKey="value"
            nameKey="name"
            innerRadius="58%"
            outerRadius="85%"
            strokeWidth={2}
            stroke="var(--card)"
            isAnimationActive={false}
          >
            {visibleData.map((entry) => {
              const paletteIndex = data.findIndex((d) => d.name === entry.name);
              return <Cell key={entry.name} fill={PALETTE[paletteIndex % PALETTE.length]} />;
            })}
          </Pie>
        </PieChart>
      </ChartContainer>
      <InteractiveLegend items={legendItems} hidden={hidden} onToggle={toggle} />
    </div>
  );
}
