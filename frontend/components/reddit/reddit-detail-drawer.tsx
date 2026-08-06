"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Drawer } from "@/components/primitives/drawer";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { STATUS_LABELS, type RedditMentionRow } from "@/lib/api/reddit";
import { useUpdateRedditMention } from "@/lib/hooks/mutations/use-update-reddit-mention";
import { formatDateFull } from "@/lib/utils/format";

export function RedditDetailDrawer({
  row,
  open,
  onOpenChange,
}: {
  row: RedditMentionRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [suggestedReply, setSuggestedReply] = useState(row.suggestedReply);
  const [internalNotes, setInternalNotes] = useState("");
  const updateMention = useUpdateRedditMention();

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={row.postTitle}
      description={`${row.subreddit} · ${row.author} · ${formatDateFull(new Date(row.createdAt))}`}
    >
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Full Post</p>
          <a
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            View on Reddit <ExternalLink className="size-3" />
          </a>
        </div>
        <p className="whitespace-pre-line text-sm text-muted-foreground">{row.fullPost}</p>
      </div>

      <Separator />

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Top Comments</p>
        <div className="space-y-3">
          {row.topComments.map((comment, i) => (
            <div key={i} className="rounded-lg border border-border bg-secondary/30 p-3">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium">{comment.author}</span>
                <span className="text-muted-foreground">{comment.score} points</span>
              </div>
              <p className="text-sm text-muted-foreground">{comment.text}</p>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">AI Summary</p>
        <p className="text-sm text-muted-foreground">{row.aiSummary}</p>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Suggested Reply</p>
        <Textarea value={suggestedReply} onChange={(e) => setSuggestedReply(e.target.value)} rows={4} className="text-sm" />
      </div>

      <Separator />

      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Status Timeline</p>
        <div className="space-y-4">
          {row.statusTimeline.map((event, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="size-2 rounded-full bg-foreground" />
                {i < row.statusTimeline.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
              </div>
              <div className="pb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{STATUS_LABELS[event.status] ?? event.status}</Badge>
                  <span className="text-xs text-muted-foreground">{event.actor}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateFull(new Date(event.date))}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Assigned Owner</p>
        <p className="text-sm text-muted-foreground">{row.ownerId ?? "Unassigned"}</p>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Internal Notes</p>
        <Textarea
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          rows={3}
          placeholder="Add a note for the team…"
          className="text-sm"
        />
      </div>
    </Drawer>
  );
}
