"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCompactNumber } from "@/lib/utils/format";
import type { MetricSummary, SummaryResult } from "@/lib/api/search-console";

export type GscMetricKey = "clicks" | "impressions" | "ctr" | "position";

export interface GscMetricMeta {
  key: GscMetricKey;
  label: string;
  color: string;
  /** lower is better (position) → delta sign interpretation flips */
  lowerIsBetter?: boolean;
}

// GSC colour semantics: clicks blue, impressions purple, CTR green, position orange.
export const GSC_METRICS: GscMetricMeta[] = [
  { key: "clicks", label: "Total clicks", color: "#4285F4" },
  { key: "impressions", label: "Total impressions", color: "#5E5CE6" },
  { key: "ctr", label: "Average CTR", color: "#34A853" },
  { key: "position", label: "Average position", color: "#F9AB00", lowerIsBetter: true },
];

export function formatGscMetric(key: GscMetricKey, value: number): string {
  if (key === "ctr") return `${(value * 100).toFixed(1)}%`;
  if (key === "position") return value.toFixed(1);
  return formatCompactNumber(value);
}

function DeltaBadge({ metric, lowerIsBetter }: { metric: MetricSummary; lowerIsBetter?: boolean }) {
  if (metric.deltaPct === null) return null;
  const up = metric.deltaPct >= 0;
  const good = lowerIsBetter ? !up : up;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", good ? "text-success" : "text-danger")}>
      <Icon className="size-3" />
      {Math.abs(metric.deltaPct).toFixed(1)}%
    </span>
  );
}

/**
 * The four toggleable metric cards across the top of Performance. Clicking a
 * card adds/removes its series from the chart (like GSC). Colour = series colour.
 */
export function GscMetricCards({
  summary,
  selected,
  onToggle,
}: {
  summary: SummaryResult;
  selected: Set<GscMetricKey>;
  onToggle: (key: GscMetricKey) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {GSC_METRICS.map((m) => {
        const metric = summary[m.key];
        const active = selected.has(m.key);
        return (
          <button
            key={m.key}
            onClick={() => onToggle(m.key)}
            aria-pressed={active}
            className={cn(
              "rounded-xl border bg-card p-4 text-left transition-colors",
              active ? "border-transparent ring-2" : "border-border hover:border-foreground/20"
            )}
            style={active ? ({ ["--tw-ring-color"]: m.color } as React.CSSProperties) : undefined}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className="size-2 rounded-full" style={{ backgroundColor: m.color }} />
                {m.label}
              </span>
              <DeltaBadge metric={metric} lowerIsBetter={m.lowerIsBetter} />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{formatGscMetric(m.key, metric.value)}</p>
          </button>
        );
      })}
    </div>
  );
}
