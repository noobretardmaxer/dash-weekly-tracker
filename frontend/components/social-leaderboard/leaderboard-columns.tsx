import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreatorCell } from "@/components/social-leaderboard/creator-cell";
import type { LeaderboardRow } from "@/lib/api/social-leaderboard";
import { formatCompactNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

function MovementCell({ movement }: { movement: number | null }) {
  if (movement === null) {
    return <Badge className="border-transparent bg-foreground/10 text-foreground">NEW</Badge>;
  }
  if (movement === 0) {
    return (
      <span className="inline-flex items-center text-muted-foreground">
        <Minus className="size-3.5" />
      </span>
    );
  }
  const isUp = movement > 0;
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-sm font-medium", isUp ? "text-success" : "text-danger")}>
      <Icon className="size-3.5" />
      {Math.abs(movement)}
    </span>
  );
}

export function buildLeaderboardColumns(days: number): ColumnDef<LeaderboardRow, unknown>[] {
  return [
    {
      accessorKey: "rank",
      header: "Rank",
      cell: ({ getValue }) => <span className="font-medium">#{getValue<number>()}</span>,
    },
    {
      accessorKey: "movement",
      header: "24h",
      cell: ({ getValue }) => <MovementCell movement={getValue<number | null>()} />,
    },
    {
      id: "account",
      accessorFn: (row) => row.creator.name,
      header: "Account",
      cell: ({ row }) => <CreatorCell creator={row.original.creator} />,
    },
    {
      accessorKey: "interactions",
      header: `Interactions (${days}d)`,
      cell: ({ getValue }) => formatCompactNumber(getValue<number>()),
    },
    {
      accessorKey: "impressions",
      header: `Impressions (${days}d)`,
      cell: ({ getValue }) => formatCompactNumber(getValue<number>()),
    },
    {
      accessorKey: "posts",
      header: `Posts (${days}d)`,
    },
  ];
}
