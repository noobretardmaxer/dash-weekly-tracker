"use client";

import { Cell, Funnel, FunnelChart as RechartsFunnelChart, LabelList } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { AppChartTooltip } from "@/components/primitives/chart-tooltip";
import type { FunnelStep } from "@/lib/mock-data/types";

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function AppFunnelChart({
  data,
  height,
  valueFormatter = (v: number) => `${v}%`,
}: {
  data: FunnelStep[];
  height: number;
  valueFormatter?: (value: number) => string;
}) {
  return (
    <ChartContainer config={{}} style={{ height }} className="w-full">
      <RechartsFunnelChart>
        <ChartTooltip content={<AppChartTooltip valueFormatter={valueFormatter} />} />
        <Funnel dataKey="value" data={data} nameKey="name" isAnimationActive={false}>
          <LabelList position="right" dataKey="name" stroke="none" fill="var(--foreground)" fontSize={12} />
          <LabelList
            position="center"
            dataKey="value"
            stroke="none"
            fill="var(--card)"
            fontSize={12}
            formatter={(v: unknown) => valueFormatter(Number(v))}
          />
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Funnel>
      </RechartsFunnelChart>
    </ChartContainer>
  );
}
