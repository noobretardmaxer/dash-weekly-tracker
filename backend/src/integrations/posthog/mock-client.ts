import { faker } from "@faker-js/faker";
import { generateTimeSeries, FIXTURE_SEEDS } from "../shared/fixtures/time-series";
import type { DailyPoint, PostHogClient, PostHogRawPayload } from "./types";

function withinRange(points: DailyPoint[], from: Date, to: Date): DailyPoint[] {
  const fromIso = from.toISOString().slice(0, 10);
  const toIso = to.toISOString().slice(0, 10);
  return points.filter((p) => p.date >= fromIso && p.date <= toIso);
}

/**
 * Ported from lib/mock-data/website.ts so MOCK_MODE output matches the
 * dashboard's original static demo data.
 */
export function createPostHogMockClient(): PostHogClient {
  async function authenticate(): Promise<void> {
    // no-op in mock mode
  }

  async function fetch({ from, to }: { from: Date; to: Date }): Promise<PostHogRawPayload> {
    faker.seed(FIXTURE_SEEDS.posthog);

    const visitorsSeries = generateTimeSeries({ baseValue: 3400, volatility: 0.14, trendPct: 22, weekendFactor: 0.82 });
    const uniqueVisitorsSeries = visitorsSeries.map((p) => ({
      date: p.date,
      value: Math.round(p.value * faker.number.float({ min: 0.62, max: 0.72, fractionDigits: 2 })),
    }));
    const returningVisitorsSeries = visitorsSeries.map((p, i) => ({
      date: p.date,
      value: Math.max(0, p.value - uniqueVisitorsSeries[i].value),
    }));
    const signupsSeries = generateTimeSeries({ baseValue: 55, volatility: 0.25, trendPct: 30, weekendFactor: 0.75, minValue: 5 });
    const activationRateSeries = generateTimeSeries({ baseValue: 27, volatility: 0.15, trendPct: -8, minValue: 12, round: false });
    const avgSessionDurationSeries = generateTimeSeries({ baseValue: 210, volatility: 0.1, trendPct: 6, minValue: 60 });
    const bounceRateSeries = generateTimeSeries({ baseValue: 46, volatility: 0.08, trendPct: -6, minValue: 20, round: false });

    const PAGE_PATHS = [
      "/",
      "/docs/getting-started",
      "/pricing",
      "/blog/graphrag-explained",
      "/product/vector-search",
      "/product/graph-database",
      "/compare/neo4j-alternative",
      "/blog/hybrid-search-guide",
      "/customers",
      "/docs/api-reference",
    ];

    return {
      visitors: withinRange(visitorsSeries, from, to),
      uniqueVisitors: withinRange(uniqueVisitorsSeries, from, to),
      returningVisitors: withinRange(returningVisitorsSeries, from, to),
      signups: withinRange(signupsSeries, from, to),
      activationRate: withinRange(activationRateSeries, from, to),
      avgSessionDurationSec: withinRange(avgSessionDurationSeries, from, to),
      bounceRate: withinRange(bounceRateSeries, from, to),
      trafficSources: [
        { name: "Organic Search", value: 42 },
        { name: "Direct", value: 23 },
        { name: "Referral", value: 15 },
        { name: "Social", value: 11 },
        { name: "Email", value: 6 },
        { name: "Paid", value: 3 },
      ],
      deviceBreakdown: [
        { name: "Desktop", value: 58 },
        { name: "Mobile", value: 36 },
        { name: "Tablet", value: 6 },
      ],
      countryBreakdown: [
        { name: "United States", value: 34 },
        { name: "India", value: 18 },
        { name: "United Kingdom", value: 9 },
        { name: "Germany", value: 8 },
        { name: "Canada", value: 6 },
        { name: "Brazil", value: 5 },
        { name: "Other", value: 20 },
      ],
      topLandingPages: PAGE_PATHS.slice(0, 8)
        .map((page) => ({
          page,
          visitors: faker.number.int({ min: 800, max: 9000 }),
          bounceRate: faker.number.float({ min: 28, max: 62, fractionDigits: 1 }),
          avgTimeSeconds: faker.number.int({ min: 45, max: 340 }),
        }))
        .sort((a, b) => b.visitors - a.visitors),
      topExitPages: PAGE_PATHS.slice(2)
        .map((page) => ({
          page,
          exits: faker.number.int({ min: 200, max: 4200 }),
          exitRate: faker.number.float({ min: 12, max: 58, fractionDigits: 1 }),
        }))
        .sort((a, b) => b.exits - a.exits),
      activationFunnel: [
        { name: "Website Visitors", value: 100 },
        { name: "Signed Up", value: 8.4 },
        { name: "Activated", value: 4.9 },
        { name: "Retained (W2)", value: 3.1 },
      ],
      conversionFunnel: [
        { name: "Landing Page", value: 100 },
        { name: "Docs / Pricing", value: 41 },
        { name: "Signup Started", value: 18 },
        { name: "Signup Completed", value: 11 },
        { name: "Activated", value: 6.4 },
      ],
    };
  }

  return { authenticate, fetch };
}
