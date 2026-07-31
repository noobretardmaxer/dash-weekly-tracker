import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { KeywordRankingRow } from "@/lib/mock-data/keywords";
import { cn } from "@/lib/utils";
import { formatCompactNumber, formatPercent } from "@/lib/utils/format";

function MovementCell({ movement }: { movement: number }) {
  if (movement === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
        <Minus className="size-3.5" />0
      </span>
    );
  }
  const isUp = movement > 0;
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", isUp ? "text-success" : "text-danger")}>
      <Icon className="size-3.5" />
      {Math.abs(movement)}
    </span>
  );
}

export const keywordRankingsColumns: ColumnDef<KeywordRankingRow, unknown>[] = [
  { accessorKey: "keyword", header: "Keyword" },
  { accessorKey: "currentPosition", header: "Current Position", cell: ({ getValue }) => `#${getValue<number>()}` },
  { accessorKey: "previousPosition", header: "Previous Position", cell: ({ getValue }) => `#${getValue<number>()}` },
  {
    accessorKey: "movement",
    header: "Movement",
    cell: ({ getValue }) => <MovementCell movement={getValue<number>()} />,
  },
  { accessorKey: "searchVolume", header: "Search Volume", cell: ({ getValue }) => formatCompactNumber(getValue<number>()) },
  { accessorKey: "difficulty", header: "Difficulty" },
  { accessorKey: "clicks", header: "Clicks", cell: ({ getValue }) => formatCompactNumber(getValue<number>()) },
  { accessorKey: "ctr", header: "CTR", cell: ({ getValue }) => formatPercent(getValue<number>()) },
  { accessorKey: "landingPage", header: "Landing Page" },
];
