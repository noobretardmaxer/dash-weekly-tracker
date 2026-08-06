import { prisma } from "../../db/prisma-client";
import type { BlogNormalizedBundle } from "./types";

/**
 * One blog sync run writes two tables: BlogMetric (one row per day, upserted by
 * the unique `date`) and BlogPost (the top-posts snapshot, upserted by the
 * (slug, capturedAt) unique constraint). The returned count sums rows written.
 */
export async function store(bundles: BlogNormalizedBundle[]): Promise<{ count: number }> {
  let count = 0;

  for (const bundle of bundles) {
    await Promise.all(
      bundle.metrics.map((metric) =>
        prisma.blogMetric.upsert({
          where: { date: metric.date },
          create: metric,
          update: metric,
        })
      )
    );
    count += bundle.metrics.length;

    await Promise.all(
      bundle.posts.map((post) =>
        prisma.blogPost.upsert({
          where: { slug_capturedAt: { slug: post.slug, capturedAt: post.capturedAt } },
          create: post,
          update: post,
        })
      )
    );
    count += bundle.posts.length;
  }

  return { count };
}
