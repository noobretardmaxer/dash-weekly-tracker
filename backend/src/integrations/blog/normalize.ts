import type { BlogNormalizedBundle, BlogRawPayload } from "./types";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function normalize(raw: BlogRawPayload, source: string): Promise<BlogNormalizedBundle[]> {
  const capturedAt = new Date(raw.capturedAt);

  return [
    {
      metrics: raw.metrics.map((m) => ({
        date: new Date(m.date),
        blogsPublished: m.blogsPublished,
        blogVisitors: m.blogVisitors,
        avgReadingTimeSec: m.avgReadingTimeSec,
        contentConversions: m.contentConversions,
        topCategories: m.topCategories,
        source,
      })),
      posts: raw.posts.map((p) => ({
        title: p.title,
        slug: slugify(p.title),
        category: p.category,
        visitors: p.visitors,
        timeOnPageSec: p.timeOnPageSeconds,
        ctr: p.ctr,
        conversions: p.conversions,
        capturedAt,
      })),
    },
  ];
}
