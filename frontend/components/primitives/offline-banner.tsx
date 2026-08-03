"use client";

import { WifiOff } from "lucide-react";
import { useUiSimulation } from "@/lib/hooks/use-ui-simulation";

export function OfflineBanner() {
  const { isOffline } = useUiSimulation();

  if (!isOffline) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-danger/15 px-4 py-1.5 text-xs font-medium text-danger">
      <WifiOff className="size-3.5" />
      You&apos;re offline — showing the last synced data.
    </div>
  );
}
