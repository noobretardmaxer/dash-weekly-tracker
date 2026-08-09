"use client";

import { AlertCircle, AlertTriangle, Map } from "lucide-react";
import { SyncStatusBanner } from "@/components/primitives/sync-status-banner";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGscParams } from "@/lib/hooks/use-gsc-params";
import { useGscSitemaps } from "@/lib/hooks/queries/use-gsc";
import { formatNumber } from "@/lib/utils/format";

const CARD = "rounded-xl border border-border bg-card p-4 sm:p-5";

/** Format a nullable ISO date string to a locale date, or an em-dash. */
function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString();
}

function SitemapsSkeleton() {
  return (
    <div className={CARD}>
      <div className="animate-pulse space-y-3">
        <div className="h-8 rounded bg-muted" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-6 rounded bg-muted/60" />
        ))}
      </div>
    </div>
  );
}

export function GscSitemaps() {
  const params = useGscParams();
  const { data, isLoading, isError } = useGscSitemaps(params.property);

  return (
    <div className="space-y-4">
      <SyncStatusBanner integration="gsc" label="Search Console" />

      {isLoading ? (
        <SitemapsSkeleton />
      ) : isError ? (
        <ErrorState />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Map}
          title="No sitemaps found"
          description="No submitted sitemaps have been synced for this property yet. Sitemap data syncs on the daily schedule."
        />
      ) : (
        <div className={CARD}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sitemap</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Last read</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Discovered URLs</TableHead>
                <TableHead className="text-right">Indexed</TableHead>
                <TableHead>Issues</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((sitemap) => (
                <TableRow key={sitemap.id}>
                  <TableCell className="font-medium">
                    <span className="block max-w-[280px] truncate" title={sitemap.path}>
                      {sitemap.path}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{sitemap.type ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {formatDate(sitemap.lastSubmitted)}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {formatDate(sitemap.lastDownloaded)}
                  </TableCell>
                  <TableCell>
                    {sitemap.isPending ? (
                      <Badge variant="secondary">Pending</Badge>
                    ) : (
                      <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                        Processed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(sitemap.submittedUrls)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(sitemap.indexedUrls)}
                  </TableCell>
                  <TableCell>
                    {sitemap.errors > 0 || sitemap.warnings > 0 ? (
                      <span className="inline-flex items-center gap-3 tabular-nums">
                        {sitemap.errors > 0 && (
                          <span className="inline-flex items-center gap-1 text-danger">
                            <AlertCircle className="size-3.5" />
                            {sitemap.errors}
                          </span>
                        )}
                        {sitemap.warnings > 0 && (
                          <span className="inline-flex items-center gap-1 text-warning">
                            <AlertTriangle className="size-3.5" />
                            {sitemap.warnings}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
