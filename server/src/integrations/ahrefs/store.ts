import { prisma } from "../../db/prisma-client";
import type { AhrefsNormalizedBundle } from "./types";

/**
 * Unlike the single-table integrations, one Ahrefs sync run writes to three
 * Prisma tables: SeoMetric (one row for the day), KeywordRanking (many rows,
 * upserted by the (keyword, checkedAt) unique constraint), and
 * CompetitorMetric (many rows, upserted by the (competitorDomain, date)
 * unique constraint). The returned count sums rows written across all three.
 */
export async function store(bundles: AhrefsNormalizedBundle[]): Promise<{ count: number }> {
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
