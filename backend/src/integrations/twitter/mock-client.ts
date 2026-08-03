import { faker } from "@faker-js/faker";
import { generateTimeSeries, FIXTURE_SEEDS } from "../shared/fixtures/time-series";
import type { DailyPoint, TwitterClient, TwitterRawPayload } from "./types";

function withinRange(points: DailyPoint[], from: Date, to: Date): DailyPoint[] {
  const fromIso = from.toISOString().slice(0, 10);
  const toIso = to.toISOString().slice(0, 10);
  return points.filter((p) => p.date >= fromIso && p.date <= toIso);
}

const TWEET_TEXTS = [
  "GraphRAG is changing how teams build retrieval for AI agents. Here's why graph + vector beats vector-only search 🧵",
  "HydraDB now supports hybrid search out of the box — combine keyword, vector, and graph traversal in one query.",
  "Benchmarked HydraDB vs 3 popular vector databases on recall@10. Results inside.",
  "New docs: building a multi-hop reasoning pipeline for your AI agent's memory layer.",
  "We're seeing more teams replace bolted-on vector search with a native graph + vector database. Makes sense once you hit multi-hop queries.",
  "Shipped: serverless HydraDB clusters with sub-100ms p99 for hybrid queries.",
];

/**
 * Ported from lib/mock-data/twitter.ts so MOCK_MODE output matches the
 * dashboard's original static demo data. Unlike client.ts (which is limited
 * by Twitter API v2's standard tier to a single current-day point per
 * metric), this mock client returns full multi-day history so local/demo
 * mode still has rich charts.
 */
export function createTwitterMockClient(): TwitterClient {
  async function authenticate(): Promise<void> {
    // no-op in mock mode
  }

  async function fetch({ from, to }: { from: Date; to: Date }): Promise<TwitterRawPayload> {
    faker.seed(FIXTURE_SEEDS.twitter);

    const followersSeries = generateTimeSeries({ baseValue: 8200, volatility: 0.03, trendPct: 12 });

    // Net new followers per day, derived from the cumulative followers series.
    const newFollowersSeries = followersSeries.map((point, i) => ({
      date: point.date,
      value: i === 0 ? 0 : Math.max(0, point.value - followersSeries[i - 1].value),
    }));

    const mentionsSeries = generateTimeSeries({ baseValue: 14, volatility: 0.4, trendPct: 18, minValue: 0 });
    const profileVisitsSeries = generateTimeSeries({
      baseValue: 260,
      volatility: 0.22,
      trendPct: 15,
      weekendFactor: 0.75,
    });
    const engagementRateSeries = generateTimeSeries({
      baseValue: 2.4,
      volatility: 0.18,
      trendPct: 10,
      minValue: 0.3,
      round: false,
    });
    const linkClicksSeries = generateTimeSeries({ baseValue: 95, volatility: 0.25, trendPct: 14, weekendFactor: 0.8 });

    const topTweets = TWEET_TEXTS.map((text) => ({
      text,
      impressions: faker.number.int({ min: 1200, max: 68000 }),
      likes: faker.number.int({ min: 20, max: 1400 }),
      reposts: faker.number.int({ min: 4, max: 320 }),
      replies: faker.number.int({ min: 1, max: 140 }),
    })).sort((a, b) => b.impressions - a.impressions);

    return {
      followers: withinRange(followersSeries, from, to),
      newFollowers: withinRange(newFollowersSeries, from, to),
      mentions: withinRange(mentionsSeries, from, to),
      profileVisits: withinRange(profileVisitsSeries, from, to),
      engagementRate: withinRange(engagementRateSeries, from, to),
      linkClicks: withinRange(linkClicksSeries, from, to),
      topTweets,
    };
  }

  return { authenticate, fetch };
}
