"use client";

import { useRef, useState } from "react";
import { ExternalLink, Link2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Links (§6.5).
 *
 * The Search Console API does not expose link reports (external/internal links)
 * at all, so there is no live data source to render here. Per the project's
 * strict no-mock-data rule, this is an honest empty-state shell that explains
 * the limitation and the substitution path — it never fabricates link rows.
 */
export function GscLinks() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<string | null>(null);

  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    // We intentionally do NOT parse the file or invent data — the import
    // pipeline isn't wired up yet. Just acknowledge the selection honestly.
    if (event.target.files && event.target.files.length > 0) {
      setNote("CSV import isn't wired up yet — coming soon.");
    }
    // Reset so selecting the same file again re-triggers onChange.
    event.target.value = "";
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Link2 className="size-4.5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Links</h3>
          <p className="max-w-prose text-xs text-muted-foreground">
            External and internal link reports aren&apos;t available through the
            Search Console API. To see link data here you can manually import a
            CSV exported from Search Console&apos;s &ldquo;Export external
            links&rdquo;, or wait for a dedicated Ahrefs / SEMrush integration
            (planned for Phase 2).
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload />
          Import CSV
        </Button>
        <Button variant="ghost" asChild>
          <a
            href="https://search.google.com/search-console/links"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink />
            View in Search Console
          </a>
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>

      {note && <p className="mt-3 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
