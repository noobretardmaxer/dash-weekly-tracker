import { faker } from "@faker-js/faker";
import { FIXTURE_SEEDS, generateTimeSeries, MASTER_SERIES_DAYS } from "../shared/fixtures/time-series";
import type { BlogClient, BlogPostRaw, BlogRawPayload, BlogTopCategory } from "./types";

const BLOG_TITLES = [
  "GraphRAG Explained: How Graph + Vector Retrieval Works",
  "Hybrid Search: Combining Vector and Keyword Search",
  "HydraDB vs Neo4j: Choosing a Graph Database in 2026",
  "Building an AI Agent Memory Layer with a Graph Database",
  "Knowledge Graphs vs Vector Databases: What's the Difference",
  "A Practical Guide to Vector Indexing with HNSW",
  "Scaling Graph Queries for Real-Time Recommendations",
  "Why Retrieval-Augmented Generation Needs a Graph",
  "Multi-Hop Reasoning with Graph Databases",
  "Migrating from a Relational Database to HydraDB",
  "Benchmarking Vector Databases: A HydraDB Case Study",
  "Fraud Detection Patterns Using Graph Analytics",
];
const BLOG_CATEGORIES = ["Engineering", "Product", "AI & ML", "Comparisons", "Tutorials", "Company"];

function toDayStart(date: Date): string {
  // Truncate to the day (UTC) so repeated same-day runs upsert the same snapshot.
  return `${date.toISOString().slice(0, 10)}T00:00:00.000Z`;
}

/**
 * Fixture blog analytics, ported from the old prisma/seed.ts::seedBlogMetrics so
 * MOCK_MODE output matches the dashboard's original demo data. Generates the full
 * master series and lets the caller's date-range window select from it (the
 * runIntegration seam only stores what normalize/store emit).
 */
export function createBlogMockClient(): BlogClient {
  async function authenticate(): Promise<void> {
    // no-op: fixture source, no credentials
  }

  async function fetch(range: { from: Date; to: Date }): Promise<BlogRawPayload> {
    faker.seed(FIXTURE_SEEDS.content);

    const blogsPublishedSeries = generateTimeSeries({ days: MASTER_SERIES_DAYS, baseValue: 0.3, volatility: 0.6, trendPct: 40, minValue: 0, round: false }).map((p) => ({
      date: p.date,
      value: Math.round(p.value),
    }));
    const blogVisitorsSeries = generateTimeSeries({ days: MASTER_SERIES_DAYS, baseValue: 1100, volatility: 0.18, trendPct: 26, weekendFactor: 0.8 });
    const avgReadingTimeSeries = generateTimeSeries({ days: MASTER_SERIES_DAYS, baseValue: 280, volatility: 0.08, trendPct: 9, minValue: 90 });
    const contentConversionsSeries = generateTimeSeries({ days: MASTER_SERIES_DAYS, baseValue: 9, volatility: 0.35, trendPct: 22, minValue: 0 });

    const posts: BlogPostRaw[] = BLOG_TITLES.map((title) => ({
      title,
      category: faker.helpers.arrayElement(BLOG_CATEGORIES),
      visitors: faker.number.int({ min: 400, max: 9800 }),
      timeOnPageSeconds: faker.number.int({ min: 90, max: 480 }),
      ctr: faker.number.float({ min: 1.2, max: 9.5, fractionDigits: 1 }),
      conversions: faker.number.int({ min: 0, max: 140 }),
    })).sort((a, b) => b.visitors - a.visitors);

    const topCategories: BlogTopCategory[] = Object.entries(
      posts.reduce<Record<string, number>>((acc, b) => {
        acc[b.category] = (acc[b.category] ?? 0) + b.visitors;
        return acc;
      }, {})
    )
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const fromIso = range.from.toISOString().slice(0, 10);
    const toIso = range.to.toISOString().slice(0, 10);

    const metrics = blogsPublishedSeries
      .map((point, i) => ({
        date: point.date,
        blogsPublished: point.value,
        blogVisitors: blogVisitorsSeries[i].value,
        avgReadingTimeSec: avgReadingTimeSeries[i].value,
        contentConversions: contentConversionsSeries[i].value,
        topCategories,
      }))
      .filter((m) => m.date >= fromIso && m.date <= toIso);

    return { capturedAt: toDayStart(range.to), metrics, posts };
  }

  return { authenticate, fetch };
}
