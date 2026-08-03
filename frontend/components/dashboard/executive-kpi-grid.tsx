"use client";

import { KpiCard } from "@/components/primitives/kpi-card";
import { KpiCardSkeleton } from "@/components/primitives/skeletons/kpi-card-skeleton";
import { ErrorState } from "@/components/primitives/error-state";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { useDashboardOverview } from "@/lib/hooks/queries/use-dashboard-overview";

export function ExecutiveKpiGrid() {
  const { days } = useDateRange();
  const { data, isLoading, isError, refetch } = useDashboardOverview({ days });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {data.kpiGrid.map((metric) => (
        <KpiCard key={metric.id} metric={metric} />
      ))}
    </div>
  );
}
