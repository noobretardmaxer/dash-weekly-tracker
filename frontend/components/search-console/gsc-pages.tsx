"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { FileWarning, ListChecks } from "lucide-react";
import { SyncStatusBanner } from "@/components/primitives/sync-status-banner";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { Drawer } from "@/components/primitives/drawer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGscParams } from "@/lib/hooks/use-gsc-params";
import { useGscIndexStatus, useGscCoverageUrls } from "@/lib/hooks/queries/use-gsc";
import { formatNumber } from "@/lib/utils/format";

/** Coverage states that point at a real content/config problem, not just an intentional exclusion. */
const HIGH_SEVERITY = /404|not found|redirect|error|blocked/i;

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-card p-4 sm:p-5 ${className ?? ""}`}>{children}</div>;
}

/**
 * Drill-down panel: loads the real inspected URLs for one coverage state and lists
 * their verdict + last crawl time. Nothing is fabricated — an empty response shows
 * an honest empty state.
 */
function CoverageDrawer({
  property,
  coverageState,
  onClose,
}: {
  property?: string;
  coverageState: string | null;
  onClose: () => void;
}) {
  const coverage = useGscCoverageUrls(property, coverageState);
  const rows = coverage.data?.rows ?? [];
  const total = coverage.data?.total ?? 0;

  return (
    <Drawer
      open={Boolean(coverageState)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={coverageState ?? "URLs"}
      description={
        coverage.isSuccess && total > 0
          ? `${formatNumber(total)} URL${total === 1 ? "" : "s"} reported under this status (showing up to ${rows.length}).`
          : undefined
      }
    >
      {coverage.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : coverage.isError ? (
        <ErrorState onRetry={() => coverage.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FileWarning}
          title="No URLs to show"
          description="No inspected URLs are currently reported under this status."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.url} className="rounded-lg border border-border p-3">
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="block break-all text-sm text-primary hover:underline"
              >
                {r.url}
              </a>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {r.verdict && <Badge variant="outline">{r.verdict}</Badge>}
                {r.lastCrawlTime && (
                  <span>Last crawled {formatDistanceToNow(new Date(r.lastCrawlTime), { addSuffix: true })}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}

/**
 * Page indexing (§6.4) — derived entirely from the URL Inspection API results we
 * store. Surfaces indexed vs not-indexed counts and the real reasons pages are
 * excluded, with a drill-down to the affected URLs.
 */
export function GscPageIndexing() {
  const params = useGscParams();
  const indexStatus = useGscIndexStatus(params.property);
  const [selected, setSelected] = useState<string | null>(null);

  if (indexStatus.isLoading) {
    return (
      <div className="space-y-4">
        <SyncStatusBanner integration="gsc" label="Search Console" />
        <Card>
          <div className="flex gap-10">
            <div className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        </Card>
        <Card>
          <Skeleton className="h-4 w-44" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  if (indexStatus.isError) {
    return (
      <div className="space-y-4">
        <SyncStatusBanner integration="gsc" label="Search Console" />
        <ErrorState onRetry={() => indexStatus.refetch()} />
      </div>
    );
  }

  const data = indexStatus.data;

  if (!data || data.total === 0) {
    return (
      <div className="space-y-4">
        <SyncStatusBanner integration="gsc" label="Search Console" />
        <EmptyState
          icon={ListChecks}
          title="No index data yet"
          description="Page indexing is derived from the URL Inspection API, which runs on a rolling daily schedule. Counts will populate as URLs are inspected."
        />
      </div>
    );
  }

  const notIndexedReasons = data.byCoverageState.filter((r) => !r.indexed);

  return (
    <div className="space-y-4">
      <SyncStatusBanner integration="gsc" label="Search Console" />

      <Card>
        <div className="flex gap-10">
          <div>
            <p className="text-3xl font-semibold tracking-tight text-success tabular-nums">{formatNumber(data.indexed)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Indexed</p>
          </div>
          <div>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">{formatNumber(data.notIndexed)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Not indexed</p>
          </div>
        </div>
        <p className="mt-4 text-[11px] text-muted-foreground">
          Derived from {data.source}
          {data.lastInspectedAt &&
            ` · last sampled ${formatDistanceToNow(new Date(data.lastInspectedAt), { addSuffix: true })}`}
        </p>
      </Card>

      <Card>
        <h3 className="text-sm font-medium">Why pages aren&apos;t indexed</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Reasons reported by URL Inspection. Select a reason to see the affected URLs.
        </p>

        {notIndexedReasons.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={ListChecks}
              title="No indexing issues"
              description="Every inspected URL is currently indexed."
            />
          </div>
        ) : (
          <div className="mt-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Pages</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notIndexedReasons.map((row) => {
                  const severe = HIGH_SEVERITY.test(row.coverageState);
                  return (
                    <TableRow
                      key={row.coverageState}
                      className="cursor-pointer"
                      onClick={() => setSelected(row.coverageState)}
                      aria-label={`View URLs for ${row.coverageState}`}
                    >
                      <TableCell>
                        {severe ? (
                          <Badge variant="destructive">{row.coverageState}</Badge>
                        ) : (
                          <span className="text-sm">{row.coverageState}</span>
                        )}
                      </TableCell>
                      <TableCell
                        className={`text-right tabular-nums ${severe ? "font-semibold text-danger" : "text-muted-foreground"}`}
                      >
                        {formatNumber(row.count)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <CoverageDrawer property={params.property} coverageState={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
