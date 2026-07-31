import { faker } from "@faker-js/faker";
import { SEEDS } from "./seed";
import { generateTimeSeries } from "./utils";

faker.seed(SEEDS.searchConsole);

export const clicksSeries = generateTimeSeries({
  baseValue: 620,
  volatility: 0.15,
  trendPct: 16,
  weekendFactor: 0.8,
});

export const impressionsSeries = generateTimeSeries({
  baseValue: 18500,
  volatility: 0.12,
  trendPct: 20,
  weekendFactor: 0.85,
});

export const ctrSeries = generateTimeSeries({
  baseValue: 3.3,
  volatility: 0.1,
  trendPct: 8,
  minValue: 0.5,
  round: false,
});

export const avgPositionSeries = generateTimeSeries({
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

function buildQueryRow(query: string) {
  const impressions = faker.number.int({ min: 800, max: 42000 });
  const clicks = Math.round(impressions * faker.number.float({ min: 0.01, max: 0.12, fractionDigits: 3 }));
  return {
    query,
    clicks,
    impressions,
    ctr: Number(((clicks / impressions) * 100).toFixed(1)),
    position: faker.number.float({ min: 1.2, max: 34, fractionDigits: 1 }),
  };
}

export const topQueries = QUERY_TERMS.map(buildQueryRow).sort((a, b) => b.clicks - a.clicks);

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

export const topPages = SC_PAGE_PATHS.map((page) => {
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

export const countries = COUNTRIES.map((country) => {
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

export const devices = DEVICES.map((device) => {
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

export const discoverPerformance = generateTimeSeries({
  baseValue: 2400,
  volatility: 0.22,
  trendPct: 14,
  days: 30,
}).map((p) => ({ date: p.date, impressions: p.value * 8, clicks: p.value }));

const SEARCH_APPEARANCE_TYPES = ["Regular results", "Rich results (FAQ)", "Sitelinks", "Video results"];

export const searchAppearance = SEARCH_APPEARANCE_TYPES.map((type) => {
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
