"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDateRange } from "@/lib/hooks/use-date-range";

export function HeaderCompareToggle() {
  const { compareEnabled, setCompareEnabled } = useDateRange();

  return (
    <div className="hidden items-center gap-2 lg:flex">
      <Switch id="compare-toggle" checked={compareEnabled} onCheckedChange={setCompareEnabled} />
      <Label htmlFor="compare-toggle" className="text-xs font-normal text-muted-foreground">
        Compare previous week
      </Label>
    </div>
  );
}
