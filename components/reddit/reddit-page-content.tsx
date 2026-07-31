"use client";

import { useMemo, useState } from "react";
import { SectionHeader } from "@/components/primitives/section-header";
import { DataTable } from "@/components/primitives/data-table";
import { buildRedditColumns } from "@/components/reddit/reddit-columns";
import { RedditDetailDrawer } from "@/components/reddit/reddit-detail-drawer";
import { redditMentions, type RedditMentionRow } from "@/lib/mock-data/reddit";

export function RedditPageContent() {
  const [rows, setRows] = useState(redditMentions);
  const [selectedRow, setSelectedRow] = useState<RedditMentionRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const newCount = useMemo(() => rows.filter((r) => r.status === "New").length, [rows]);
  const highPriorityCount = useMemo(
    () => rows.filter((r) => r.priority === "High" || r.priority === "Critical").length,
    [rows]
  );
  const unresolvedCount = useMemo(() => rows.filter((r) => r.status !== "Resolved" && r.status !== "Ignored").length, [rows]);

  const columns = useMemo(
    () =>
      buildRedditColumns((row, action) => {
        if (action === "view" || action === "assign") {
          setSelectedRow(row);
          setDrawerOpen(true);
          return;
        }
        if (action === "resolve") {
          setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: "Resolved" } : r)));
        }
      }),
    []
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Reddit Intelligence"
        description="Triage HydraDB mentions across Reddit like a CRM pipeline."
      />

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-border bg-secondary/40 px-3 py-1">{newCount} New</span>
        <span className="rounded-full border border-border bg-danger/10 px-3 py-1 text-danger">{highPriorityCount} High Priority</span>
        <span className="rounded-full border border-border bg-secondary/40 px-3 py-1">{unresolvedCount} Unresolved</span>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        searchPlaceholder="Search posts, authors, subreddits…"
        exportFilename="reddit-mentions"
        onRowClick={(row) => {
          setSelectedRow(row);
          setDrawerOpen(true);
        }}
        maxHeight={560}
        emptyTitle="No mentions match your filters"
        emptyDescription="Try clearing your search or adjusting filters."
      />

      {selectedRow && (
        <RedditDetailDrawer key={selectedRow.id} row={selectedRow} open={drawerOpen} onOpenChange={setDrawerOpen} />
      )}
    </div>
  );
}
