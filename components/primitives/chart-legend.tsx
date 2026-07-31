"use client";

import { cn } from "@/lib/utils";

export type LegendItem = {
  key: string;
  label: string;
  color: string;
  dashed?: boolean;
};

export function InteractiveLegend({
  items,
  hidden,
  onToggle,
}: {
  items: LegendItem[];
  hidden: Set<string>;
  onToggle: (key: string) => void;
}) {
  if (items.length <= 1) {
    return (
      <div className="flex items-center justify-center gap-4 pt-3 text-xs text-muted-foreground">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-1.5">
            <span
              className={cn("h-2 w-2 shrink-0 rounded-[2px]", item.dashed && "border border-dashed")}
              style={{ backgroundColor: item.dashed ? "transparent" : item.color, borderColor: item.color }}
            />
            {item.label}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs">
      {items.map((item) => {
        const isHidden = hidden.has(item.key);
        return (
          <button
            key={item.key}
            onClick={() => onToggle(item.key)}
            className={cn(
              "flex items-center gap-1.5 transition-opacity",
              isHidden ? "text-muted-foreground/50" : "text-muted-foreground"
            )}
          >
            <span
              className={cn("h-2 w-2 shrink-0 rounded-[2px]", item.dashed && "border border-dashed")}
              style={{ backgroundColor: item.dashed ? "transparent" : item.color, borderColor: item.color }}
            />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
