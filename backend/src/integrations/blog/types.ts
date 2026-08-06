export type BlogTopCategory = { name: string; value: number };

/**
 * Shape produced by the fixture client (there is no real blog/CMS source yet;
 * content analytics normally comes from an internal CMS rather than any of the
 * PostHog/Ahrefs/etc. APIs). normalize() only ever sees this shape.
 *
 * `capturedAt` is a per-run snapshot timestamp for the blog_posts leaderboard;
 * it is truncated to the day so re-running the sync within the same day upserts
 * the same rows instead of accumulating duplicates.
 */
export type BlogMetricRaw = {
  date: string; // ISO date
  blogsPublished: number;
  blogVisitors: number;
  avgReadingTimeSec: number;
  contentConversions: number;
  topCategories: BlogTopCategory[];
};

export type BlogPostRaw = {
  title: string;
  category: string;
  visitors: number;
  timeOnPageSeconds: number;
  ctr: number;
  conversions: number;
};

export type BlogRawPayload = {
  capturedAt: string; // ISO datetime, truncated to the day
  metrics: BlogMetricRaw[];
  posts: BlogPostRaw[];
};

export interface BlogClient {
  authenticate(): Promise<void>;
  fetch(range: { from: Date; to: Date }): Promise<BlogRawPayload>;
}

export type BlogMetricRecord = {
  date: Date;
  blogsPublished: number;
  blogVisitors: number;
  avgReadingTimeSec: number;
  contentConversions: number;
  topCategories: BlogTopCategory[];
  source: string;
};

export type BlogPostRecord = {
  title: string;
  slug: string;
  category: string;
  visitors: number;
  timeOnPageSec: number;
  ctr: number;
  conversions: number;
  capturedAt: Date;
};

/**
 * One blog sync run writes to two Prisma tables (BlogMetric — one row per day,
 * and BlogPost — the current top-posts snapshot), so normalize() returns an
 * array of this composite bundle (always a single element per run), mirroring
 * the Ahrefs integration's multi-table pattern.
 */
export type BlogNormalizedBundle = {
  metrics: BlogMetricRecord[];
  posts: BlogPostRecord[];
};
