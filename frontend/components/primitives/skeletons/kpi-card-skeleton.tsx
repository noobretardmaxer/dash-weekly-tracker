import { Skeleton } from "@/components/ui/skeleton";

export function KpiCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3.5 w-10" />
      </div>
      <Skeleton className="mt-3 h-7 w-20" />
      <Skeleton className="mt-4 h-9 w-full" />
    </div>
  );
}
