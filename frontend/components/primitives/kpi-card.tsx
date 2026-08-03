import type { KpiMetric } from "@/lib/mock-data/types";
import { Sparkline } from "@/components/primitives/sparkline";
import { StatTrendBadge } from "@/components/primitives/stat-trend-badge";
import { formatCompactNumber, formatDuration, formatPercent } from "@/lib/utils/format";

function formatKpiValue(metric: KpiMetric): string {
  switch (metric.format) {
    case "percent":
      return formatPercent(metric.value);
    case "position":
      return `#${metric.value.toFixed(1)}`;
    case "duration":
      return formatDuration(metric.value);
    case "compact":
    case "number":
    default:
      return formatCompactNumber(metric.value);
  }
}

export function KpiCard({ metric }: { metric: KpiMetric }) {
  const isPositive = metric.deltaPct >= 0;
  const isGood = isPositive === metric.positiveIsGood;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
        <StatTrendBadge deltaPct={metric.deltaPct} positiveIsGood={metric.positiveIsGood} />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{formatKpiValue(metric)}</p>
      <div className="mt-3 -mx-1">
        <Sparkline data={metric.series} positive={isGood} />
      </div>
    </div>
  );
}
