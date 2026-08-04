import type { ColumnDef } from "@tanstack/react-table";
import { AtSign, Briefcase, Camera, PlayCircle, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreatorCell } from "@/components/social-leaderboard/creator-cell";
import type { SocialPlatform, SocialPostRow } from "@/lib/api/social-leaderboard";
import { formatCompactNumber, formatDateShort } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export const PLATFORM_META: Record<SocialPlatform, { label: string; icon: LucideIcon; className: string }> = {
  twitter: { label: "X", icon: AtSign, className: "bg-foreground/10 text-foreground" },
  linkedin: { label: "LinkedIn", icon: Briefcase, className: "bg-[#0A66C2]/10 text-[#0A66C2]" },
  instagram: { label: "Instagram", icon: Camera, className: "bg-[#E4405F]/10 text-[#E4405F]" },
  youtube: { label: "YouTube", icon: PlayCircle, className: "bg-[#FF0000]/10 text-[#FF0000]" },
};

export function buildContentFeedColumns(days: number): ColumnDef<SocialPostRow, unknown>[] {
  return [
    {
      id: "creator",
      accessorFn: (row) => row.creator.name,
      header: "Creator",
      cell: ({ row }) => <CreatorCell creator={row.original.creator} />,
    },
    {
      accessorKey: "platform",
      header: "Platform",
      cell: ({ getValue }) => {
        const platform = getValue<SocialPlatform>();
        const meta = PLATFORM_META[platform];
        return (
          <Badge className={cn("border-transparent", meta.className)}>
            <meta.icon className="size-3" />
            {meta.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "content",
      header: "Content",
      cell: ({ getValue }) => <span className="line-clamp-2 max-w-sm text-sm">{getValue<string>()}</span>,
    },
    {
      accessorKey: "publishedAt",
      header: "Published",
      cell: ({ getValue }) => formatDateShort(new Date(getValue<string>())),
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
      id: "action",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={(e) => {
            e.stopPropagation();
            window.open(row.original.url, "_blank", "noopener,noreferrer");
          }}
        >
          <ArrowUpRight className="size-4" />
        </Button>
      ),
    },
  ];
}
