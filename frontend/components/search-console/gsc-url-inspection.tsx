"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";
import { Search } from "lucide-react";
import { SyncStatusBanner } from "@/components/primitives/sync-status-banner";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useGscParams } from "@/lib/hooks/use-gsc-params";
import { useGscUrlInspection } from "@/lib/hooks/queries/use-gsc";
import { formatDateFull } from "@/lib/utils/format";
import type { UrlInspectionDto } from "@/lib/api/search-console";

const CARD = "rounded-xl border border-border bg-card p-4 sm:p-5";

/** Verdict badge colour, mirroring Search Console: PASS→success, FAIL→danger, else muted. */
function verdictBadgeClass(verdict: string | null): string {
  switch (verdict) {
    case "PASS":
      return "border-transparent bg-success/10 text-success";
    case "FAIL":
      return "border-transparent bg-danger/10 text-danger";
    default:
      return "border-transparent bg-muted text-muted-foreground";
  }
}

function InspectionSkeleton() {
  return (
    <div className={CARD}>
      <div className="animate-pulse space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 rounded-full bg-muted" />
          <div className="h-4 w-44 rounded bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-4 w-36 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InspectionCard({ data }: { data: UrlInspectionDto }) {
  const rows: { label: string; value: string }[] = [
    { label: "Coverage", value: data.coverageState ?? "—" },
    { label: "Indexing allowed", value: data.indexingState ?? "—" },
    { label: "Robots.txt", value: data.robotsTxtState ?? "—" },
    { label: "Page fetch", value: data.pageFetchState ?? "—" },
    { label: "Crawled as", value: data.crawledAs ?? "—" },
    { label: "Last crawl", value: data.lastCrawlTime ? formatDateFull(new Date(data.lastCrawlTime)) : "—" },
    { label: "Google-selected canonical", value: data.googleCanonical ?? "—" },
    { label: "User-declared canonical", value: data.userCanonical ?? "—" },
    { label: "HTTPS", value: data.isHttps === null ? "—" : data.isHttps ? "Yes" : "No" },
  ];

  return (
    <div className={CARD}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={verdictBadgeClass(data.verdict)}>{data.verdict ?? "Unknown"}</Badge>
        <span className="text-sm font-medium">{data.coverageState ?? "—"}</span>
      </div>
      <p className="mt-1 truncate text-xs text-muted-foreground" title={data.url}>
        {data.url}
      </p>

      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            <dd className="text-sm break-words">{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-[11px] text-muted-foreground">
        Cached · inspected {formatDistanceToNow(new Date(data.inspectedAt), { addSuffix: true })}
      </p>

      <div className="mt-4">
        <Tooltip>
          <TooltipTrigger asChild>
            {/* Wrapping span keeps the tooltip reachable while the button stays disabled. */}
            <span className="inline-block">
              <Button variant="outline" disabled>
                Test live URL
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            Live inspection spends URL Inspection API quota and isn&apos;t wired up yet.
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export function GscUrlInspection() {
  const params = useGscParams();
  const [inputValue, setInputValue] = useState("");
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null);
  const { data, isLoading, isError } = useGscUrlInspection(params.property, submittedUrl);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setSubmittedUrl(trimmed);
  }

  let content: ReactNode;
  if (submittedUrl === null) {
    content = (
      <EmptyState
        icon={Search}
        title="Inspect a URL"
        description="Enter a full URL above to see its latest cached inspection from Search Console."
      />
    );
  } else if (isLoading) {
    content = <InspectionSkeleton />;
  } else if (isError) {
    content = <ErrorState />;
  } else if (!data) {
    content = (
      <EmptyState
        icon={Search}
        title="No cached inspection"
        description="This URL hasn't been inspected yet. Inspection results populate from the rolling URL Inspection job."
      />
    );
  } else {
    content = <InspectionCard data={data} />;
  }

  return (
    <div className="space-y-4">
      <SyncStatusBanner integration="gsc" label="Search Console" />

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input
          type="url"
          inputMode="url"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="Enter a URL to inspect, e.g. https://example.com/page"
          aria-label="URL to inspect"
        />
        <Button type="submit" disabled={!inputValue.trim()}>
          Inspect
        </Button>
      </form>

      {content}
    </div>
  );
}
