"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Lightbulb, Sparkles } from "lucide-react";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { wins, risks, recommendations, growthScore, healthScore, aiSummary } from "@/lib/mock-data/executive-summary";
import { cn } from "@/lib/utils";

function ScoreBadge({ label, score }: { label: string; score: number }) {
  const tone = score >= 70 ? "text-success" : score >= 45 ? "text-foreground" : "text-danger";
  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-secondary/40 px-4 py-2">
      <span className={cn("text-xl font-semibold tabular-nums", tone)}>{score}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

function SummaryList({
  title,
  icon: Icon,
  iconClassName,
  items,
}: {
  title: string;
  icon: typeof CheckCircle2;
  iconClassName: string;
  items: { id: string; text: string }[];
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className={cn("size-4", iconClassName)} />
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className="text-sm text-muted-foreground">
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ExecutiveSummaryPanel() {
  const { label } = useDateRange();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <h2 className="text-lg font-semibold tracking-tight">Executive Summary</h2>
        </div>
        <div className="flex items-center gap-3">
          <ScoreBadge label="Growth Score" score={growthScore} />
          <ScoreBadge label="Health Score" score={healthScore} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-3">
        <SummaryList title="Wins" icon={CheckCircle2} iconClassName="text-success" items={wins} />
        <SummaryList title="Risks" icon={AlertTriangle} iconClassName="text-danger" items={risks} />
        <SummaryList title="Recommendations" icon={Lightbulb} iconClassName="text-muted-foreground" items={recommendations} />
      </div>

      <div className="mt-5 flex items-start gap-2 rounded-lg border border-dashed border-border bg-secondary/30 p-3">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-xs font-medium text-muted-foreground">AI Summary</p>
          <p className="text-sm text-muted-foreground">{aiSummary}</p>
        </div>
      </div>
    </motion.div>
  );
}
