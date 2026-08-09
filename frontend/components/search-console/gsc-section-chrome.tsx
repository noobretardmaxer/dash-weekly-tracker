"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGscProperties } from "@/lib/hooks/queries/use-gsc";
import { GSC_RANGE_PRESETS, GSC_SEARCH_TYPES, useGscParams, type GscRangePreset } from "@/lib/hooks/use-gsc-params";

const PRIMARY_PRESETS: GscRangePreset[] = ["24h", "7d", "28d", "3mo"];
const MORE_PRESETS: GscRangePreset[] = ["6mo", "12mo", "16mo"];

/**
 * The shared Search Console toolbar: property selector + GSC-native date presets
 * + search-type + compare. All state lives in the URL (see useGscParams), so it
 * persists across the section's sub-pages and every view is shareable.
 */
export function GscSectionChrome() {
  const params = useGscParams();
  const { data: properties } = useGscProperties();

  const selectedProperty = params.property ?? properties?.find((p) => p.isDefault)?.siteUrl ?? properties?.[0]?.siteUrl;
  const moreActive = MORE_PRESETS.includes(params.range);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Google Search Console</h1>
          <p className="text-sm text-muted-foreground">Organic search visibility as reported by Search Console.</p>
        </div>

        {properties && properties.length > 0 && (
          <Select value={selectedProperty} onValueChange={params.setProperty}>
            <SelectTrigger className="w-[260px]" aria-label="Property">
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((p) => (
                <SelectItem key={p.siteUrl} value={p.siteUrl}>
                  <span className="flex items-center gap-2">
                    <span className="truncate">{p.displayName}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                      {p.type === "domain" ? "Domain" : "URL-prefix"}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border border-border p-0.5">
          {PRIMARY_PRESETS.map((preset) => {
            const label = GSC_RANGE_PRESETS.find((p) => p.value === preset)?.label ?? preset;
            return (
              <button
                key={preset}
                onClick={() => params.setRange(preset)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  params.range === preset ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
          <Select value={moreActive ? params.range : ""} onValueChange={(v) => params.setRange(v as GscRangePreset)}>
            <SelectTrigger
              className={cn("h-7 border-0 bg-transparent px-2.5 text-xs shadow-none", moreActive && "bg-accent text-accent-foreground")}
            >
              {moreActive ? GSC_RANGE_PRESETS.find((p) => p.value === params.range)?.label : "More"}
            </SelectTrigger>
            <SelectContent>
              {MORE_PRESETS.map((preset) => (
                <SelectItem key={preset} value={preset}>
                  {GSC_RANGE_PRESETS.find((p) => p.value === preset)?.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Select value={params.searchType} onValueChange={(v) => params.setSearchType(v as typeof params.searchType)}>
          <SelectTrigger className="h-8 w-[130px]" aria-label="Search type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GSC_SEARCH_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <Switch id="gsc-compare" checked={params.compare} onCheckedChange={params.setCompare} className="scale-90" />
          <Label htmlFor="gsc-compare" className="text-xs font-normal text-muted-foreground">
            Compare
          </Label>
        </div>
      </div>
    </div>
  );
}
