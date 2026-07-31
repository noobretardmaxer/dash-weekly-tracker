import { faker } from "@faker-js/faker";
import { SEEDS } from "./seed";
import { generateTimeSeries } from "./utils";

faker.seed(SEEDS.seo);

export const organicTrafficSeries = generateTimeSeries({
  baseValue: 1450,
  volatility: 0.13,
  trendPct: 18,
  weekendFactor: 0.85,
});

export const organicKeywordsSeries = generateTimeSeries({
  baseValue: 860,
  volatility: 0.02,
  trendPct: 24,
  round: true,
});

export const domainRatingSeries = generateTimeSeries({
  baseValue: 34,
  volatility: 0.015,
  trendPct: 15,
  minValue: 20,
  round: false,
});

export const backlinksSeries = generateTimeSeries({
  baseValue: 4200,
  volatility: 0.01,
  trendPct: 21,
});

export const referringDomainsSeries = generateTimeSeries({
  baseValue: 310,
  volatility: 0.015,
  trendPct: 19,
});

export const newBacklinksSeries = generateTimeSeries({
  baseValue: 12,
  volatility: 0.4,
  trendPct: 10,
  minValue: 0,
});

export const lostBacklinksSeries = generateTimeSeries({
  baseValue: 4,
  volatility: 0.5,
  trendPct: -5,
  minValue: 0,
});

const SEO_PAGE_PATHS = [
  "/product/graph-database",
  "/compare/neo4j-alternative",
  "/blog/graphrag-explained",
  "/blog/hybrid-search-guide",
  "/product/vector-search",
  "/docs/getting-started",
  "/blog/knowledge-graph-vs-vector-db",
  "/pricing",
];

export const seoTopPages = SEO_PAGE_PATHS.map((page) => ({
  page,
  organicTraffic: faker.number.int({ min: 400, max: 5200 }),
  keywords: faker.number.int({ min: 12, max: 220 }),
  avgPosition: faker.number.float({ min: 3, max: 28, fractionDigits: 1 }),
})).sort((a, b) => b.organicTraffic - a.organicTraffic);

const FASTEST_GROWING_KEYWORDS = [
  "graphrag database",
  "hybrid vector search",
  "graph database for ai agents",
  "vector database benchmark",
  "knowledge graph database",
  "graphrag vs vector db",
];

const LOSING_KEYWORDS = [
  "what is a graph database",
  "vector embeddings explained",
  "in-memory graph database",
  "graph database use cases",
  "vector search vs full text search",
  "open source vector database",
];

export const fastestGrowingKeywords = FASTEST_GROWING_KEYWORDS.map((keyword) => {
  const positionChange = faker.number.int({ min: 4, max: 38 });
  const currentPosition = faker.number.int({ min: 1, max: 20 });
  return { keyword, positionChange, currentPosition };
}).sort((a, b) => b.positionChange - a.positionChange);

export const losingKeywords = LOSING_KEYWORDS.map((keyword) => {
  const positionChange = -faker.number.int({ min: 3, max: 25 });
  const currentPosition = faker.number.int({ min: 8, max: 60 });
  return { keyword, positionChange, currentPosition };
}).sort((a, b) => a.positionChange - b.positionChange);
