"use client";

import { useRef, useState, type ReactNode } from "react";
import { Maximize2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { downloadNodeAsPng } from "@/lib/utils/png-export";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { useUiSimulation } from "@/lib/hooks/use-ui-simulation";
import { ErrorState } from "@/components/primitives/error-state";
import { cn } from "@/lib/utils";

export type ChartRenderContext = { compare: boolean; height: number };

export function ChartCard({
  title,
  description,
  className,
  showCompareControl = true,
  height = 260,
  dialogHeight = 440,
  headerActions,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  showCompareControl?: boolean;
  height?: number;
  dialogHeight?: number;
  headerActions?: ReactNode;
  children: (ctx: ChartRenderContext) => ReactNode;
}) {
  const { compareEnabled } = useDateRange();
  const { simulateError } = useUiSimulation();
  const [localCompare, setLocalCompare] = useState(compareEnabled);
  const [prevCompareEnabled, setPrevCompareEnabled] = useState(compareEnabled);
  const [zoomOpen, setZoomOpen] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Adjust local state when the global compare toggle changes, without an Effect
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes).
  if (compareEnabled !== prevCompareEnabled) {
    setPrevCompareEnabled(compareEnabled);
    setLocalCompare(compareEnabled);
  }

  const handleDownload = async () => {
    if (!chartRef.current) return;
    await downloadNodeAsPng(chartRef.current, title.toLowerCase().replace(/\s+/g, "-"));
  };

  const controlId = `compare-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {headerActions}
          {showCompareControl && (
            <div className="mr-1 hidden items-center gap-1.5 lg:flex">
              <Switch
                id={controlId}
                checked={localCompare}
                onCheckedChange={setLocalCompare}
                className="scale-90"
              />
              <Label htmlFor={controlId} className="text-[11px] font-normal text-muted-foreground">
                Compare
              </Label>
            </div>
          )}
          <Button variant="ghost" size="icon" className="size-7" onClick={handleDownload} title="Download PNG">
            <Download className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setZoomOpen(true)}
            title="Expand"
          >
            <Maximize2 className="size-3.5" />
          </Button>
        </div>
      </div>
      <div ref={chartRef} className="mt-3 rounded-md bg-card">
        {simulateError ? (
          <ErrorState className="border-0" description="This chart couldn't load its data." />
        ) : (
          children({ compare: localCompare, height })
        )}
      </div>

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            {simulateError ? (
              <ErrorState className="border-0" description="This chart couldn't load its data." />
            ) : (
              children({ compare: localCompare, height: dialogHeight })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
