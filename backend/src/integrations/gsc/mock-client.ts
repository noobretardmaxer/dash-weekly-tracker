import { faker } from "@faker-js/faker";
import { generateTimeSeries, FIXTURE_SEEDS } from "../shared/fixtures/time-series";
import type { DailyPoint, GscClient, GscRawPayload } from "./types";

function withinRange(points: DailyPoint[], from: Date, to: Date): DailyPoint[] {
  const fromIso = from.toISOString().slice(0, 10);
  const toIso = to.toISOString().slice(0, 10);
  return points.filter((p) => p.date >= fromIso && p.date <= toIso);
}

/**
 * Ported from lib/mock-data/search-console.ts so MOCK_MODE output matches the
 * dashboard's original static demo data.
 */
export function createGscMockClient(): GscClient {
  async function authenticate(): Promise<void> {
    // no-op in mock mode
  }

  async function fetch({ from, to }: { from: Date; to: Date }): Promise<GscRawPayload> {
    faker.seed(FIXTURE_SEEDS.gsc);

    const clicksSeries = generateTimeSeries({ baseValue: 620, volatility: 0.15, trendPct: 16, weekendFactor: 0.8 });
    const impressionsSeries = generateTimeSeries({
      baseValue: 18500,
      volatility: 0.12,
      trendPct: 20,
      weekendFactor: 0.85,
    });
    const ctrSeries = generateTimeSeries({ baseValue: 3.3, volatility: 0.1, trendPct: 8, minValue: 0.5, round: false });
    const avgPositionSeries = generateTimeSeries({
      baseValue: 16,
      volatility: 0.08,
      trendPct: -22,
      minValue: 2,
      round: false,
    });

    const QUERY_TERMS = [
      "graph database",
      "vector database",
      "graphrag",
      "hybrid vector search",
      "neo4j alternative",
      "knowledge graph database",
      "graph database for ai agents",
      "vector search vs full text search",
      "graphrag database",
      "graph database use cases",
    ];

    const topQueries = QUERY_TERMS.map((query) => {
      const impressions = faker.number.int({ min: 800, max: 42000 });
      const clicks = Math.round(impressions * faker.number.float({ min: 0.01, max: 0.12, fractionDigits: 3 }));
      return {
        query,
        clicks,
        impressions,
        ctr: Number(((clicks / impressions) * 100).toFixed(1)),
        position: faker.number.float({ min: 1.2, max: 34, fractionDigits: 1 }),
      };
    }).sort((a, b) => b.clicks - a.clicks);

    const SC_PAGE_PATHS = [
      "/",
      "/product/graph-database",
      "/product/vector-search",
      "/compare/neo4j-alternative",
      "/blog/graphrag-explained",
      "/pricing",
      "/docs/getting-started",
      "/blog/hybrid-search-guide",
    ];

    const topPages = SC_PAGE_PATHS.map((page) => {
      const impressions = faker.number.int({ min: 1500, max: 60000 });
      const clicks = Math.round(impressions * faker.number.float({ min: 0.01, max: 0.1, fractionDigits: 3 }));
      return {
        page,
        clicks,
        impressions,
        ctr: Number(((clicks / impressions) * 100).toFixed(1)),
        position: faker.number.float({ min: 1.5, max: 30, fractionDigits: 1 }),
      };
    }).sort((a, b) => b.clicks - a.clicks);

    const COUNTRIES = ["United States", "India", "United Kingdom", "Germany", "Canada", "Brazil", "France", "Australia"];

    const countries = COUNTRIES.map((country) => {
      const impressions = faker.number.int({ min: 900, max: 28000 });
      const clicks = Math.round(impressions * faker.number.float({ min: 0.01, max: 0.09, fractionDigits: 3 }));
      return {
        country,
        clicks,
        impressions,
        ctr: Number(((clicks / impressions) * 100).toFixed(1)),
        position: faker.number.float({ min: 2, max: 32, fractionDigits: 1 }),
      };
    }).sort((a, b) => b.clicks - a.clicks);

    const DEVICES = ["Desktop", "Mobile", "Tablet"];

    const devices = DEVICES.map((device) => {
      const impressions = faker.number.int({ min: 4000, max: 60000 });
      const clicks = Math.round(impressions * faker.number.float({ min: 0.015, max: 0.1, fractionDigits: 3 }));
      return {
        device,
        clicks,
        impressions,
        ctr: Number(((clicks / impressions) * 100).toFixed(1)),
        position: faker.number.float({ min: 3, max: 22, fractionDigits: 1 }),
      };
    }).sort((a, b) => b.clicks - a.clicks);

    const SEARCH_APPEARANCE_TYPES = ["Regular results", "Rich results (FAQ)", "Sitelinks", "Video results"];

    const searchAppearance = SEARCH_APPEARANCE_TYPES.map((type) => {
      const impressions = faker.number.int({ min: 1500, max: 42000 });
      const clicks = Math.round(impressions * faker.number.float({ min: 0.01, max: 0.11, fractionDigits: 3 }));
      return {
        type,
        clicks,
        impressions,
        ctr: Number(((clicks / impressions) * 100).toFixed(1)),
        position: faker.number.float({ min: 1.8, max: 26, fractionDigits: 1 }),
      };
    }).sort((a, b) => b.clicks - a.clicks);

    return {
      clicks: withinRange(clicksSeries, from, to),
      impressions: withinRange(impressionsSeries, from, to),
      ctr: withinRange(ctrSeries, from, to),
      avgPosition: withinRange(avgPositionSeries, from, to),
      topQueries,
      topPages,
      countries,
      devices,
      searchAppearance,
    };
  }

  return { authenticate, fetch };
}
