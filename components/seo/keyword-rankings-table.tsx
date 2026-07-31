"use client";

import { DataTable } from "@/components/primitives/data-table";
import { keywordRankingsColumns } from "@/components/seo/keyword-rankings-columns";
import { keywordRankings } from "@/lib/mock-data/keywords";

export function KeywordRankingsTable() {
  return (
    <DataTable
      columns={keywordRankingsColumns}
      data={keywordRankings}
      searchPlaceholder="Search keywords…"
      exportFilename="keyword-rankings"
      maxHeight={560}
    />
  );
}
