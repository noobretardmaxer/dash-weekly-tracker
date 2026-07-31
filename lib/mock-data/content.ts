import { faker } from "@faker-js/faker";
import { SEEDS } from "./seed";
import { generateTimeSeries } from "./utils";
import type { ShareSlice } from "./types";

faker.seed(SEEDS.content);

export const blogsPublishedSeries = generateTimeSeries({
  baseValue: 0.3,
  volatility: 0.6,
  trendPct: 40,
  minValue: 0,
  round: false,
}).map((p) => ({ date: p.date, value: Math.round(p.value) }));

export const blogVisitorsSeries = generateTimeSeries({
  baseValue: 1100,
  volatility: 0.18,
  trendPct: 26,
  weekendFactor: 0.8,
});

export const avgReadingTimeSeries = generateTimeSeries({
  baseValue: 280,
  volatility: 0.08,
  trendPct: 9,
  minValue: 90,
});

export const contentConversionsSeries = generateTimeSeries({
  baseValue: 9,
  volatility: 0.35,
  trendPct: 22,
  minValue: 0,
});

export const contentGrowthSeries = blogVisitorsSeries;

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

const CATEGORIES = ["Engineering", "Product", "AI & ML", "Comparisons", "Tutorials", "Company"];

export const topBlogs = BLOG_TITLES.map((title) => {
  const visitors = faker.number.int({ min: 400, max: 9800 });
  return {
    title,
    category: faker.helpers.arrayElement(CATEGORIES),
    visitors,
    timeOnPageSeconds: faker.number.int({ min: 90, max: 480 }),
    ctr: faker.number.float({ min: 1.2, max: 9.5, fractionDigits: 1 }),
    conversions: faker.number.int({ min: 0, max: 140 }),
  };
}).sort((a, b) => b.visitors - a.visitors);

export const trafficByBlog = topBlogs.slice(0, 8).map((b) => ({ name: b.title, value: b.visitors }));

export const topCategories: ShareSlice[] = Object.entries(
  topBlogs.reduce<Record<string, number>>((acc, b) => {
    acc[b.category] = (acc[b.category] ?? 0) + b.visitors;
    return acc;
  }, {})
)
  .map(([name, value]) => ({ name, value }))
  .sort((a, b) => b.value - a.value);
