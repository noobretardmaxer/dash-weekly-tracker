"use client";

import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDateShort } from "@/lib/utils/format";
import type { GscSeriesPoint } from "@/lib/api/search-console";
import { GSC_METRICS, formatGscMetric, type GscMetricKey } from "./gsc-metric-cards";

interface TooltipPayloadItem {
  dataKey: GscMetricKey;
  value: number;
}

function GscTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium">{formatDateShort(new Date(label))}</p>
      {payload.map((p) => {
        const meta = GSC_METRICS.find((m) => m.key === p.dataKey);
        if (!meta) return null;
        return (
          <p key={p.dataKey} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: meta.color }} />
            <span className="text-muted-foreground">{meta.label}:</span>
            <span className="font-medium">{formatGscMetric(meta.key, p.value)}</span>
          </p>
        );
      })}
    </div>
  );
}

/**
 * The Performance time-series. Each metric gets its own (hidden) axis so mixed
 * scales (counts vs %, position) each read correctly; position is reversed so
 * "better" (rank 1) is up, matching GSC.
 */
export function GscPerformanceChart({
  data,
  selected,
  height = 320,
}: {
  data: GscSeriesPoint[];
  selected: Set<GscMetricKey>;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={(v) => formatDateShort(new Date(v))}
        />
        {GSC_METRICS.map((m) => (
          <YAxis
            key={m.key}
            yAxisId={m.key}
            hide
            reversed={m.key === "position"}
            domain={m.key === "ctr" ? [0, "auto"] : ["auto", "auto"]}
          />
        ))}
        <Tooltip content={<GscTooltip />} />
        {GSC_METRICS.filter((m) => selected.has(m.key)).map((m) => (
          <Line
            key={m.key}
            yAxisId={m.key}
            type="monotone"
            dataKey={m.key}
            name={m.label}
            stroke={m.color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
