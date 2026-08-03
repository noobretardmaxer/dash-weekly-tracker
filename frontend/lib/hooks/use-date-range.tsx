"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type RangePreset = "7d" | "30d" | "90d" | "custom";

export type CustomRange = { from: Date; to: Date };

type DateRangeContextValue = {
  preset: RangePreset;
  setPreset: (preset: RangePreset) => void;
  customRange: CustomRange | undefined;
  setCustomRange: (range: CustomRange | undefined) => void;
  compareEnabled: boolean;
  setCompareEnabled: (enabled: boolean) => void;
  days: number;
  label: string;
};

const PRESET_DAYS: Record<Exclude<RangePreset, "custom">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const DateRangeContext = createContext<DateRangeContextValue | null>(null);

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [preset, setPreset] = useState<RangePreset>("7d");
  const [customRange, setCustomRange] = useState<CustomRange | undefined>(undefined);
  const [compareEnabled, setCompareEnabled] = useState(true);

  const days = useMemo(() => {
    if (preset === "custom" && customRange) {
      const diff = Math.round(
        (customRange.to.getTime() - customRange.from.getTime()) / (1000 * 60 * 60 * 24)
      );
      return Math.max(1, diff);
    }
    return PRESET_DAYS[preset === "custom" ? "30d" : preset];
  }, [preset, customRange]);

  const label = useMemo(() => {
    if (preset === "custom" && customRange) {
      return `${customRange.from.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${customRange.to.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
    }
    if (preset === "7d") return "Current Week";
    if (preset === "30d") return "Last 30 Days";
    return "Last 90 Days";
  }, [preset, customRange]);

  const value = useMemo(
    () => ({
      preset,
      setPreset,
      customRange,
      setCustomRange,
      compareEnabled,
      setCompareEnabled,
      days,
      label,
    }),
    [preset, customRange, compareEnabled, days, label]
  );

  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange must be used within a DateRangeProvider");
  return ctx;
}
