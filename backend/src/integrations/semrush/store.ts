import { prisma } from "../../db/prisma-client";
import type { SemrushNormalizedBundle } from "./types";

export async function store(bundles: SemrushNormalizedBundle[]): Promise<{ count: number }> {
  let count = 0;

  for (const bundle of bundles) {
    await prisma.seoMetric.upsert({
      where: { date: bundle.seoMetric.date },
      create: bundle.seoMetric,
      update: bundle.seoMetric,
    });
    count += 1;

    await Promise.all(
      bundle.keywordRankings.map((ranking) =>
        prisma.keywordRanking.upsert({
          where: { keyword_checkedAt: { keyword: ranking.keyword, checkedAt: ranking.checkedAt } },
          create: ranking,
          update: ranking,
        })
      )
    );
    count += bundle.keywordRankings.length;

    await Promise.all(
      bundle.competitorMetrics.map((metric) =>
        prisma.competitorMetric.upsert({
          where: { competitorDomain_date: { competitorDomain: metric.competitorDomain, date: metric.date } },
          create: metric,
          update: metric,
        })
      )
    );
    count += bundle.competitorMetrics.length;
  }

  return { count };
}
