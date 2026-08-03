"use client";

import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import type { TimeSeriesPoint } from "@/lib/mock-data/types";

export function Sparkline({ data, positive }: { data: TimeSeriesPoint[]; positive: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={positive ? "var(--success)" : "var(--danger)"}
          strokeWidth={1.75}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
