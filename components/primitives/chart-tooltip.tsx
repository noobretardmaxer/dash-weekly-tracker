"use client";

import type { ComponentProps } from "react";
import { ChartTooltipContent } from "@/components/ui/chart";
import { formatDateShort } from "@/lib/utils/format";

export function AppChartTooltip({
  valueFormatter,
  ...props
}: ComponentProps<typeof ChartTooltipContent> & {
  valueFormatter?: (value: number) => string;
}) {
  return (
    <ChartTooltipContent
      {...props}
      labelFormatter={(label) => {
        if (typeof label !== "string" && typeof label !== "number") return String(label ?? "");
        const date = new Date(label);
        return Number.isNaN(date.getTime()) ? String(label) : formatDateShort(date);
      }}
      formatter={
        valueFormatter
          ? (value, name) => (
              <div className="flex w-full items-center justify-between gap-4">
                <span className="text-muted-foreground">{name}</span>
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {valueFormatter(Number(value))}
                </span>
              </div>
            )
          : undefined
      }
    />
  );
}
