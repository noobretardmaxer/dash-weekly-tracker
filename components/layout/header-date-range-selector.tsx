"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useDateRange, type RangePreset } from "@/lib/hooks/use-date-range";
import type { DateRange } from "react-day-picker";

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
];

export function HeaderDateRangeSelector() {
  const { preset, setPreset, customRange, setCustomRange } = useDateRange();
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(undefined);
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center rounded-md border border-border bg-secondary/40 p-0.5 text-xs">
      {PRESETS.map((p) => (
        <button
          key={p.value}
          onClick={() => setPreset(p.value)}
          className={cn(
            "rounded-sm px-2.5 py-1 font-medium transition-colors",
            preset === p.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {p.label}
        </button>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            onClick={() => setPendingRange(customRange ? { from: customRange.from, to: customRange.to } : undefined)}
            className={cn(
              "flex items-center gap-1 rounded-sm px-2.5 py-1 font-medium transition-colors",
              preset === "custom"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarDays className="size-3.5" />
            Custom
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={pendingRange}
            onSelect={setPendingRange}
            numberOfMonths={2}
            defaultMonth={pendingRange?.from}
          />
          <div className="flex items-center justify-end gap-2 border-t border-border p-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!pendingRange?.from || !pendingRange?.to}
              onClick={() => {
                if (pendingRange?.from && pendingRange?.to) {
                  setCustomRange({ from: pendingRange.from, to: pendingRange.to });
                  setPreset("custom");
                  setOpen(false);
                }
              }}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
