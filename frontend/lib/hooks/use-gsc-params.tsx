"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CompareMode, GscSearchType, Granularity } from "@/lib/api/search-console";

/**
 * Search Console section state (property, date range, search type, granularity,
 * compare) lives in the URL query string so every view is shareable and
 * persists across the section's sub-pages. GSC-native date presets.
 */
export type GscRangePreset = "24h" | "7d" | "28d" | "3mo" | "6mo" | "12mo" | "16mo";

export const GSC_RANGE_PRESETS: { value: GscRangePreset; label: string; days: number }[] = [
  { value: "24h", label: "24 hours", days: 1 },
  { value: "7d", label: "7 days", days: 7 },
  { value: "28d", label: "28 days", days: 28 },
  { value: "3mo", label: "3 months", days: 90 },
  { value: "6mo", label: "6 months", days: 180 },
  { value: "12mo", label: "12 months", days: 365 },
  { value: "16mo", label: "16 months", days: 487 },
];

const DAYS_BY_PRESET = Object.fromEntries(GSC_RANGE_PRESETS.map((p) => [p.value, p.days])) as Record<GscRangePreset, number>;

export const GSC_SEARCH_TYPES: { value: GscSearchType; label: string }[] = [
  { value: "web", label: "Web" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "news", label: "News" },
  { value: "discover", label: "Discover" },
];

export interface GscParams {
  property?: string;
  range: GscRangePreset;
  searchType: GscSearchType;
  granularity: Granularity;
  compare: boolean;
  days: number;
  compareMode: CompareMode;
  setProperty: (v: string) => void;
  setRange: (v: GscRangePreset) => void;
  setSearchType: (v: GscSearchType) => void;
  setGranularity: (v: Granularity) => void;
  setCompare: (v: boolean) => void;
}

export function useGscParams(): GscParams {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const range = (searchParams.get("range") as GscRangePreset) || "28d";
  const searchType = (searchParams.get("type") as GscSearchType) || "web";
  const granularity = (searchParams.get("granularity") as Granularity) || "daily";
  const compare = searchParams.get("compare") !== "0"; // default on
  const property = searchParams.get("property") ?? undefined;

  const setParam = useCallback(
    (key: string, value: string | undefined) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, value);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return {
    property,
    range,
    searchType,
    granularity,
    compare,
    days: DAYS_BY_PRESET[range] ?? 28,
    compareMode: compare ? "previous_period" : "none",
    setProperty: (v) => setParam("property", v),
    setRange: (v) => setParam("range", v),
    setSearchType: (v) => setParam("type", v),
    setGranularity: (v) => setParam("granularity", v),
    setCompare: (v) => setParam("compare", v ? undefined : "0"),
  };
}
