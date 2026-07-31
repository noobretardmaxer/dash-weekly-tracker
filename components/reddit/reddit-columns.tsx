import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight, MessageSquare, MoreHorizontal } from "lucide-react";
import {
  MENTION_TYPE_LABELS,
  STATUS_LABELS,
  type RedditMentionRow,
  type RedditPriority,
  type RedditSentiment,
  type RedditStatus,
} from "@/lib/api/reddit";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const SENTIMENT_CLASSES: Record<RedditSentiment, string> = {
  Positive: "bg-success/10 text-success",
  Neutral: "bg-muted text-muted-foreground",
  Negative: "bg-danger/10 text-danger",
};

const PRIORITY_CLASSES: Record<RedditPriority, string> = {
  Critical: "bg-danger/10 text-danger",
  High: "bg-foreground/10 text-foreground",
  Medium: "bg-muted text-muted-foreground",
  Low: "bg-muted/60 text-muted-foreground/70",
};

const STATUS_CLASSES: Record<RedditStatus, string> = {
  New: "bg-foreground/10 text-foreground",
  InProgress: "bg-muted text-muted-foreground",
  Responded: "bg-muted text-muted-foreground",
  Resolved: "bg-success/10 text-success",
  Ignored: "bg-muted/60 text-muted-foreground/60",
};

export function buildRedditColumns(onAction: (row: RedditMentionRow, action: "view" | "resolve" | "assign") => void): ColumnDef<RedditMentionRow, unknown>[] {
  return [
    { accessorKey: "subreddit", header: "Subreddit", cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span> },
    {
      accessorKey: "postTitle",
      header: "Post Title",
      cell: ({ getValue }) => <span className="line-clamp-1 max-w-72">{getValue<string>()}</span>,
    },
    { accessorKey: "author", header: "Author" },
    { accessorKey: "score", header: "Score" },
    {
      accessorKey: "comments",
      header: "Comments",
      cell: ({ getValue }) => (
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <MessageSquare className="size-3.5" />
          {getValue<number>()}
        </span>
      ),
    },
    {
      accessorKey: "sentiment",
      header: "Sentiment",
      cell: ({ getValue }) => {
        const sentiment = getValue<RedditSentiment>();
        return <Badge className={cn("border-transparent", SENTIMENT_CLASSES[sentiment])}>{sentiment}</Badge>;
      },
    },
    {
      accessorKey: "mentionType",
      header: "Mention Type",
      cell: ({ getValue }) => MENTION_TYPE_LABELS[getValue<keyof typeof MENTION_TYPE_LABELS>()],
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ getValue }) => {
        const priority = getValue<RedditPriority>();
        return <Badge className={cn("border-transparent", PRIORITY_CLASSES[priority])}>{priority}</Badge>;
      },
    },
    {
      id: "owner",
      accessorFn: (row) => row.owner?.name ?? "Unassigned",
      header: "Owner",
      cell: ({ row }) => {
        const owner = row.original.owner;
        return (
          <span className="inline-flex items-center gap-2">
            <Avatar className="size-5">
              <AvatarFallback className="text-[10px]">{owner?.initials ?? "?"}</AvatarFallback>
            </Avatar>
            <span className="whitespace-nowrap">{owner?.name ?? "Unassigned"}</span>
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const status = getValue<RedditStatus>();
        return <Badge className={cn("border-transparent", STATUS_CLASSES[status])}>{STATUS_LABELS[status]}</Badge>;
      },
    },
    {
      id: "action",
      header: "Action",
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onSelect={() => onAction(row.original, "view")}>
              <ArrowUpRight className="size-4" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction(row.original, "resolve")}>Mark resolved</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction(row.original, "assign")}>Reassign owner</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
