"use client";

import { Bar, BarChart as RechartsBarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { AppChartTooltip } from "@/components/primitives/chart-tooltip";
import { truncateLabel } from "@/lib/utils/format";

export type BarDatum = { name: string; value: number };

export function AppBarChart({
  data,
  height,
  layout = "vertical",
  valueFormatter = (v: number) => v.toLocaleString(),
  barColor = "var(--chart-1)",
  colorForEntry,
}: {
  data: BarDatum[];
  height: number;
  /** "vertical" = column chart (categories on x-axis). "horizontal" = bars lying horizontally (categories on y-axis). */
  layout?: "vertical" | "horizontal";
  valueFormatter?: (value: number) => string;
  barColor?: string;
  colorForEntry?: (entry: BarDatum) => string;
}) {
  const isHorizontalBars = layout === "horizontal";

  return (
    <ChartContainer config={{}} style={{ height }} className="w-full">
      <RechartsBarChart
        data={data}
        layout={isHorizontalBars ? "vertical" : "horizontal"}
        margin={{ left: isHorizontalBars ? 4 : 4, right: 12, top: 4, bottom: isHorizontalBars ? 0 : 24 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={!isHorizontalBars} vertical={isHorizontalBars} />
        {isHorizontalBars ? (
          <>
            <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={valueFormatter} />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={150}
              tickFormatter={(v: string) => truncateLabel(v, 20)}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={50}
            />
            <YAxis tickLine={false} axisLine={false} tickFormatter={valueFormatter} width={44} />
          </>
        )}
        <ChartTooltip content={<AppChartTooltip valueFormatter={valueFormatter} />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
        <Bar dataKey="value" name="Value" radius={[4, 4, 4, 4]} fill={barColor} maxBarSize={36} isAnimationActive={false}>
          {colorForEntry && data.map((entry, i) => <Cell key={entry.name + i} fill={colorForEntry(entry)} />)}
        </Bar>
      </RechartsBarChart>
    </ChartContainer>
  );
}
