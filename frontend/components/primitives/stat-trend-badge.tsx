import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSignedPercent } from "@/lib/utils/format";

export function StatTrendBadge({
  deltaPct,
  positiveIsGood = true,
  className,
}: {
  deltaPct: number;
  positiveIsGood?: boolean;
  className?: string;
}) {
  const isPositive = deltaPct >= 0;
  const isGood = isPositive === positiveIsGood;
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        isGood ? "text-success" : "text-danger",
        className
      )}
    >
      <Icon className="size-3.5" />
      {formatSignedPercent(deltaPct)}
    </span>
  );
}
