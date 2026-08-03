import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import { generateTimeSeries, MASTER_SERIES_DAYS } from "../src/integrations/shared/fixtures/time-series";
import { createPostHogIntegration } from "../src/integrations/posthog";
import { createGscIntegration } from "../src/integrations/gsc";
import { createAhrefsIntegration } from "../src/integrations/ahrefs";
import { createTwitterIntegration } from "../src/integrations/twitter";
import { createDiscordIntegration } from "../src/integrations/discord";
import { createRedditIntegration, DEFAULT_REDDIT_KEYWORDS } from "../src/integrations/reddit";
import { DEFAULT_ALERT_THRESHOLDS } from "../src/services/alerts/rules";
import { generateExecutiveReport } from "../src/services/reports/generate-executive-report";

const prisma = new PrismaClient();

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const TEAM_MEMBERS = [
  { name: "Sayandeep Das", initials: "SD", role: "admin" as const },
  { name: "Priya Raman", initials: "PR", role: "viewer" as const },
  { name: "Jordan Kim", initials: "JK", role: "viewer" as const },
  { name: "Alex Chen", initials: "AC", role: "viewer" as const },
  { name: "Morgan Lee", initials: "ML", role: "viewer" as const },
  { name: "Fatima Qureshi", initials: "FQ", role: "viewer" as const },
];

function emailFor(name: string): string {
  return `${name.toLowerCase().replace(/\s+/g, ".")}@hydradb.com`;
}

async function seedUsers(): Promise<void> {
  for (const member of TEAM_MEMBERS) {
    await prisma.user.upsert({
      where: { email: emailFor(member.name) },
      create: { email: emailFor(member.name), name: member.name, initials: member.initials, role: member.role },
      update: { name: member.name, initials: member.initials, role: member.role },
    });
  }
  console.log(`Seeded ${TEAM_MEMBERS.length} users`);
}

async function seedSettings(): Promise<void> {
  await prisma.setting.upsert({
    where: { key: "reddit.keywords" },
    create: { key: "reddit.keywords", value: DEFAULT_REDDIT_KEYWORDS },
    update: {},
  });
  await prisma.setting.upsert({
    where: { key: "alerts.thresholds" },
    create: { key: "alerts.thresholds", value: DEFAULT_ALERT_THRESHOLDS },
    update: {},
  });
  console.log("Seeded settings (reddit.keywords, alerts.thresholds)");
}

async function seedIntegration(name: string, createModule: () => { authenticate(): Promise<void>; fetch(range: { from: Date; to: Date }): Promise<unknown>; normalize(raw: unknown): Promise<unknown[]>; store(records: unknown[]): Promise<{ count: number }> }): Promise<void> {
  const integration = createModule();
  const range = { from: new Date(Date.now() - MASTER_SERIES_DAYS * 24 * 60 * 60 * 1000), to: new Date() };

  await integration.authenticate();
  const raw = await integration.fetch(range);
  const normalized = await integration.normalize(raw);
  const { count } = await integration.store(normalized);
  console.log(`Seeded ${name}: ${count} records`);
}

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

/**
 * blog_metrics/blog_posts have no dedicated third-party integration in the spec (content
 * analytics typically comes from an internal CMS, not PostHog/Ahrefs/etc.), so this fixture
 * is seeded directly here, ported from lib/mock-data/content.ts, rather than via a sync job.
 */
async function seedBlogMetrics(): Promise<void> {
  faker.seed(1004);

  const blogsPublishedSeries = generateTimeSeries({ days: MASTER_SERIES_DAYS, baseValue: 0.3, volatility: 0.6, trendPct: 40, minValue: 0, round: false }).map((p) => ({
    date: p.date,
    value: Math.round(p.value),
  }));
  const blogVisitorsSeries = generateTimeSeries({ days: MASTER_SERIES_DAYS, baseValue: 1100, volatility: 0.18, trendPct: 26, weekendFactor: 0.8 });
  const avgReadingTimeSeries = generateTimeSeries({ days: MASTER_SERIES_DAYS, baseValue: 280, volatility: 0.08, trendPct: 9, minValue: 90 });
  const contentConversionsSeries = generateTimeSeries({ days: MASTER_SERIES_DAYS, baseValue: 9, volatility: 0.35, trendPct: 22, minValue: 0 });

  const topBlogs = BLOG_TITLES.map((title) => ({
    title,
    category: faker.helpers.arrayElement(BLOG_CATEGORIES),
    visitors: faker.number.int({ min: 400, max: 9800 }),
    timeOnPageSeconds: faker.number.int({ min: 90, max: 480 }),
    ctr: faker.number.float({ min: 1.2, max: 9.5, fractionDigits: 1 }),
    conversions: faker.number.int({ min: 0, max: 140 }),
  })).sort((a, b) => b.visitors - a.visitors);

  const topCategories = Object.entries(
    topBlogs.reduce<Record<string, number>>((acc, b) => {
      acc[b.category] = (acc[b.category] ?? 0) + b.visitors;
      return acc;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  await Promise.all(
    blogsPublishedSeries.map((point, i) =>
      prisma.blogMetric.upsert({
        where: { date: new Date(point.date) },
        create: {
          date: new Date(point.date),
          blogsPublished: point.value,
          blogVisitors: blogVisitorsSeries[i].value,
          avgReadingTimeSec: avgReadingTimeSeries[i].value,
          contentConversions: contentConversionsSeries[i].value,
          topCategories,
          source: "mock",
        },
        update: {},
      })
    )
  );

  const capturedAt = new Date();
  await Promise.all(
    topBlogs.map((post) =>
      prisma.blogPost.upsert({
        where: { slug_capturedAt: { slug: slugify(post.title), capturedAt } },
        create: {
          title: post.title,
          slug: slugify(post.title),
          category: post.category,
          visitors: post.visitors,
          timeOnPageSec: post.timeOnPageSeconds,
          ctr: post.ctr,
          conversions: post.conversions,
          capturedAt,
        },
        update: {},
      })
    )
  );

  console.log(`Seeded blog_metrics (${blogsPublishedSeries.length} days) and blog_posts (${topBlogs.length} posts)`);
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run the seed script with NODE_ENV=production");
  }

  await seedUsers();
  await seedSettings();

  await seedIntegration("posthog", createPostHogIntegration);
  await seedIntegration("gsc", createGscIntegration);
  await seedIntegration("ahrefs", createAhrefsIntegration);
  await seedIntegration("twitter", createTwitterIntegration);
  await seedIntegration("discord", createDiscordIntegration);
  await seedIntegration("reddit", createRedditIntegration);
  await seedBlogMetrics();

  const report = await generateExecutiveReport();
  console.log(`Seeded initial executive report: ${report.id}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
