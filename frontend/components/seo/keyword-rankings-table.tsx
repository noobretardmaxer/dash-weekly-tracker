"use client";

import { DataTable } from "@/components/primitives/data-table";
import { ErrorState } from "@/components/primitives/error-state";
import { DataSourceCaption } from "@/components/primitives/data-source-caption";
import { TableSkeleton } from "@/components/primitives/skeletons/table-skeleton";
import { keywordRankingsColumns } from "@/components/seo/keyword-rankings-columns";
import { useKeywordRankings } from "@/lib/hooks/queries/use-keyword-rankings";

export function KeywordRankingsTable() {
  const { data, isLoading, isError, refetch } = useKeywordRankings({ pageSize: 200 });

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError || !data) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <DataSourceCaption asOf={data[0]?.checkedAt} />
      <DataTable
        columns={keywordRankingsColumns}
        data={data}
        searchPlaceholder="Search keywords…"
        exportFilename="keyword-rankings"
        maxHeight={560}
      />
    </div>
  );
}
