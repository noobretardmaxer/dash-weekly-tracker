import { faker } from "@faker-js/faker";
import { SEEDS } from "./seed";
import { generateTimeSeries } from "./utils";

faker.seed(SEEDS.twitter);

export const followersSeries = generateTimeSeries({
  baseValue: 8200,
  volatility: 0.03,
  trendPct: 12,
});

/** Net new followers per day, derived from the cumulative followers series. */
export const newFollowersSeries = followersSeries.map((point, i) => ({
  date: point.date,
  value: i === 0 ? 0 : Math.max(0, point.value - followersSeries[i - 1].value),
}));

export const mentionsSeries = generateTimeSeries({
  baseValue: 14,
  volatility: 0.4,
  trendPct: 18,
  minValue: 0,
});

export const profileVisitsSeries = generateTimeSeries({
  baseValue: 260,
  volatility: 0.22,
  trendPct: 15,
  weekendFactor: 0.75,
});

export const engagementRateSeries = generateTimeSeries({
  baseValue: 2.4,
  volatility: 0.18,
  trendPct: 10,
  minValue: 0.3,
  round: false,
});

export const linkClicksSeries = generateTimeSeries({
  baseValue: 95,
  volatility: 0.25,
  trendPct: 14,
  weekendFactor: 0.8,
});

const TWEET_TEXTS = [
  "GraphRAG is changing how teams build retrieval for AI agents. Here's why graph + vector beats vector-only search 🧵",
  "HydraDB now supports hybrid search out of the box — combine keyword, vector, and graph traversal in one query.",
  "Benchmarked HydraDB vs 3 popular vector databases on recall@10. Results inside.",
  "New docs: building a multi-hop reasoning pipeline for your AI agent's memory layer.",
  "We're seeing more teams replace bolted-on vector search with a native graph + vector database. Makes sense once you hit multi-hop queries.",
  "Shipped: serverless HydraDB clusters with sub-100ms p99 for hybrid queries.",
];

export const topTweets = TWEET_TEXTS.map((text) => ({
  text,
  impressions: faker.number.int({ min: 1200, max: 68000 }),
  likes: faker.number.int({ min: 20, max: 1400 }),
  reposts: faker.number.int({ min: 4, max: 320 }),
  replies: faker.number.int({ min: 1, max: 140 }),
})).sort((a, b) => b.impressions - a.impressions);
