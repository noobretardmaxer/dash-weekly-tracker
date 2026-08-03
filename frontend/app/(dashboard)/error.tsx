"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/primitives/error-state";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center p-6">
      <ErrorState
        title="This page failed to load"
        description="An unexpected error occurred while rendering this section."
        onRetry={reset}
        className="max-w-sm"
      />
    </div>
  );
}
