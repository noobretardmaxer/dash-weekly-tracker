"use client";

import { AppBarChart } from "@/components/charts/bar-chart";
import type { CompetitorProfile } from "@/lib/constants/competitors";

type NumericCompetitorKey = "domainRating" | "backlinks" | "organicTraffic" | "organicKeywords";

export function CompetitorOverviewChart({
  data,
  metric,
  height,
  valueFormatter = (v: number) => v.toLocaleString(),
}: {
  data: CompetitorProfile[];
  metric: NumericCompetitorKey;
  height: number;
  valueFormatter?: (value: number) => string;
}) {
  const chartData = data
    .map((c) => ({ name: c.name, value: c[metric], isHydraDB: Boolean(c.isHydraDB) }))
    .sort((a, b) => b.value - a.value);

  return (
    <AppBarChart
      data={chartData}
      height={height}
      layout="horizontal"
      valueFormatter={valueFormatter}
      colorForEntry={(entry) => (chartData.find((d) => d.name === entry.name)?.isHydraDB ? "var(--foreground)" : "var(--chart-3)")}
    />
  );
}
