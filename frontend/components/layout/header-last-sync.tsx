"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw } from "lucide-react";

export function HeaderLastSync() {
  const [syncedAt] = useState(() => new Date(Date.now() - 4 * 60 * 1000));
  const [label, setLabel] = useState("recently");

  useEffect(() => {
    const update = () => setLabel(formatDistanceToNow(syncedAt, { addSuffix: true }));
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [syncedAt]);

  return (
    <div className="hidden items-center gap-1.5 text-xs text-muted-foreground xl:flex">
      <RefreshCw className="size-3.5" />
      <span>Synced {label}</span>
    </div>
  );
}
