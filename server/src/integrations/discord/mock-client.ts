import { faker } from "@faker-js/faker";
import { generateTimeSeries, FIXTURE_SEEDS } from "../shared/fixtures/time-series";
import type { DailyPoint, DiscordClient, DiscordRawPayload } from "./types";

function withinRange(points: DailyPoint[], from: Date, to: Date): DailyPoint[] {
  const fromIso = from.toISOString().slice(0, 10);
  const toIso = to.toISOString().slice(0, 10);
  return points.filter((p) => p.date >= fromIso && p.date <= toIso);
}

/**
 * Ported from lib/mock-data/discord.ts so MOCK_MODE output matches the
 * dashboard's original static demo data.
 */
export function createDiscordMockClient(): DiscordClient {
  async function authenticate(): Promise<void> {
    // no-op in mock mode
  }

  async function fetch({ from, to }: { from: Date; to: Date }): Promise<DiscordRawPayload> {
    faker.seed(FIXTURE_SEEDS.discord);

    const memberCountSeries = generateTimeSeries({ baseValue: 5400, volatility: 0.02, trendPct: 14 });
    const dauSeries = generateTimeSeries({ baseValue: 420, volatility: 0.15, trendPct: 11, weekendFactor: 0.85 });
    const wauSeries = generateTimeSeries({ baseValue: 1650, volatility: 0.1, trendPct: 13 });
    const messagesSeries = generateTimeSeries({ baseValue: 980, volatility: 0.2, trendPct: 17, weekendFactor: 0.7 });

    const CHANNEL_NAMES = [
      "#general",
      "#help",
      "#graphrag",
      "#showcase",
      "#feature-requests",
      "#announcements",
      "#vector-search",
      "#job-board",
    ];

    const topChannels = CHANNEL_NAMES.map((name) => ({
      name,
      messages: faker.number.int({ min: 120, max: 8200 }),
      activeMembers: faker.number.int({ min: 20, max: 640 }),
    })).sort((a, b) => b.messages - a.messages);

    const MEMBER_NAMES = [
      "kavya.dev",
      "riley_codes",
      "sam.builds",
      "priya_ml",
      "jordan.k",
      "alex_graphs",
      "morgan.vec",
      "chen.wei",
      "diego_ai",
      "fatima.q",
    ];

    const mostActiveMembers = MEMBER_NAMES.map((username) => ({
      username,
      messages: faker.number.int({ min: 80, max: 2100 }),
      roles: faker.helpers.arrayElements(["Contributor", "Beta Tester", "Moderator", "Partner"], { min: 1, max: 2 }),
    })).sort((a, b) => b.messages - a.messages);

    return {
      memberCount: withinRange(memberCountSeries, from, to),
      dau: withinRange(dauSeries, from, to),
      wau: withinRange(wauSeries, from, to),
      messages: withinRange(messagesSeries, from, to),
      topChannels,
      mostActiveMembers,
    };
  }

  return { authenticate, fetch };
}
