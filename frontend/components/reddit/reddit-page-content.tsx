"use client";

import { useMemo, useState } from "react";
import { SectionHeader } from "@/components/primitives/section-header";
import { SyncStatusBanner } from "@/components/primitives/sync-status-banner";
import { DataTable } from "@/components/primitives/data-table";
import { ErrorState } from "@/components/primitives/error-state";
import { TableSkeleton } from "@/components/primitives/skeletons/table-skeleton";
import { buildRedditColumns } from "@/components/reddit/reddit-columns";
import { RedditDetailDrawer } from "@/components/reddit/reddit-detail-drawer";
import { useRedditMentions } from "@/lib/hooks/queries/use-reddit-mentions";
import { useUpdateRedditMention } from "@/lib/hooks/mutations/use-update-reddit-mention";
import type { RedditMentionRow } from "@/lib/api/reddit";

export function RedditPageContent() {
  const { data, isLoading, isError, refetch } = useRedditMentions();
  const updateMention = useUpdateRedditMention();
  const [selectedRow, setSelectedRow] = useState<RedditMentionRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const rows = useMemo(() => data?.data ?? [], [data]);

  const newCount = useMemo(() => rows.filter((r) => r.status === "New").length, [rows]);
  const highPriorityCount = useMemo(
    () => rows.filter((r) => r.priority === "High" || r.priority === "Critical").length,
    [rows]
  );
  const unresolvedCount = useMemo(
    () => rows.filter((r) => r.status !== "Resolved" && r.status !== "Ignored").length,
    [rows]
  );

  // Keep the selected row in sync with the latest fetched data (e.g. after a mutation refetch)
  // so the drawer reflects the persisted state rather than a stale snapshot.
  const selectedRowLatest = useMemo(
    () => (selectedRow ? rows.find((r) => r.id === selectedRow.id) ?? selectedRow : null),
    [rows, selectedRow]
  );

  const columns = useMemo(
    () =>
      buildRedditColumns((row, action) => {
        if (action === "view" || action === "assign") {
          setSelectedRow(row);
          setDrawerOpen(true);
          return;
        }
        if (action === "resolve") {
          updateMention.mutate({ id: row.id, patch: { status: "Resolved" } });
        }
      }),
    [updateMention]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Reddit Intelligence"
          description="Triage HydraDB mentions across Reddit like a CRM pipeline."
        />
        <TableSkeleton rows={10} columns={9} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Reddit Intelligence"
          description="Triage HydraDB mentions across Reddit like a CRM pipeline."
        />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Reddit Intelligence"
        description="Triage HydraDB mentions across Reddit like a CRM pipeline."
      />
      <SyncStatusBanner integration="reddit" label="Reddit" />

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

      {selectedRowLatest && (
        <RedditDetailDrawer key={selectedRowLatest.id} row={selectedRowLatest} open={drawerOpen} onOpenChange={setDrawerOpen} />
      )}
    </div>
  );
}
