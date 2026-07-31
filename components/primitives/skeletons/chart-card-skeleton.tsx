import { Skeleton } from "@/components/ui/skeleton";

export function ChartCardSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="mt-4 w-full" style={{ height }} />
    </div>
  );
}
