"use client";

import { ArrowDown, ArrowRight } from "lucide-react";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { useBlogOverview } from "@/lib/hooks/queries/use-blog-overview";
import { formatCompactNumber, formatNumber, formatPercent } from "@/lib/utils/format";

const sum = (arr: { value: number }[]) => arr.reduce((a, p) => a + p.value, 0);

function FlowStage({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-lg border border-border bg-secondary/30 px-4 py-3 text-center">
      <span className="text-xl font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function FlowConnector({ rate }: { rate: string }) {
  return (
    <div className="flex flex-row items-center gap-2 px-1 sm:flex-col sm:gap-1 sm:px-2">
      <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
      <ArrowDown className="size-4 shrink-0 text-muted-foreground sm:hidden" />
      <span className="text-[11px] whitespace-nowrap font-medium text-muted-foreground">{rate}</span>
    </div>
  );
}

export function ContentToSignupsFlow() {
  const { days } = useDateRange();
  const { data, isLoading, isError } = useBlogOverview({ days });

  if (isLoading || isError || !data) {
    return null;
  }

  const contentPieces = sum(data.charts.blogsPublished.current);
  const traffic = sum(data.charts.blogVisitors.current);
  const signups = sum(data.charts.contentConversions.current);

  const trafficPerPiece = contentPieces > 0 ? traffic / contentPieces : 0;
  const conversionRate = traffic > 0 ? (signups / traffic) * 100 : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-medium">Content → Traffic → Signups</h3>
        <p className="text-xs text-muted-foreground">How published content converts into signups this period — optimize the last step.</p>
      </div>
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <FlowStage label="Content Pieces Published" value={formatNumber(contentPieces)} />
        <FlowConnector rate={`${formatCompactNumber(trafficPerPiece)} visits / piece`} />
        <FlowStage label="Traffic Driven" value={formatCompactNumber(traffic)} />
        <FlowConnector rate={`${formatPercent(conversionRate)} converts`} />
        <FlowStage label="Signups" value={formatNumber(signups)} />
      </div>
    </div>
  );
}
