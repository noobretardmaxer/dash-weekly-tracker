"use client";

import { useState } from "react";
import { Database } from "lucide-react";
import { cn } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_AFTER_DAYS = 2; // Semrush syncs daily; >2 days = a missed sync.

function ymd(date: Date): string {
  // Deterministic, locale/timezone-independent date label (matches the snapshot's
  // UTC day) so SSR and client render identically — no hydration mismatch.
  return date.toISOString().slice(0, 10);
}

/**
 * Compact "Source: Semrush · as of {date}" caption for a data panel. Turns amber
 * ("stale") when the underlying snapshot is older than two days, so an old sync is
 * never silently presented as current. When there's no data yet it says so rather
 * than implying freshness.
 */
export function DataSourceCaption({
  source = "Semrush",
  asOf,
  className,
}: {
  source?: string;
  asOf?: string | Date | null;
  className?: string;
}) {
  // Capture "now" once (lazy initializer runs a single time, not on every render),
  // keeping the render body free of impure Date.now() calls.
  const [now] = useState(() => Date.now());

  const date = asOf ? new Date(asOf) : null;
  const valid = date !== null && !Number.isNaN(date.getTime());
  const ageDays = valid ? Math.floor((now - date!.getTime()) / DAY_MS) : null;
  const stale = ageDays !== null && ageDays > STALE_AFTER_DAYS;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground",
        stale && "text-warning",
        className
      )}
    >
      <Database className="size-3.5 shrink-0" />
      <span>Source: {source}</span>
      <span aria-hidden>·</span>
      {valid ? (
        <span>
          as of {ymd(date!)}
          {ageDays !== null && ageDays > 0 ? ` (${ageDays}d ago)` : " (today)"}
          {stale ? " · stale" : ""}
        </span>
      ) : (
        <span>not yet synced</span>
      )}
    </div>
  );
}
