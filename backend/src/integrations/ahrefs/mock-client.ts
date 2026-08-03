import { faker } from "@faker-js/faker";
import { generateTimeSeries, FIXTURE_SEEDS } from "../shared/fixtures/time-series";
import type {
  AhrefsClient,
  AhrefsRawPayload,
  CompetitorProfileRow,
  KeywordMovement,
  KeywordRankingRow,
  SeoTopPage,
} from "./types";

function latest(series: { date: string; value: number }[]): number {
  return series[series.length - 1]?.value ?? 0;
}

// --- ported from lib/mock-data/seo.ts ---

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

// --- ported from lib/mock-data/keywords.ts ---

const KEYWORD_TERMS = [
  "graph database",
  "vector database",
  "graphrag",
  "graphrag database",
  "knowledge graph database",
  "hybrid vector search",
  "vector search vs full text search",
  "graph database for ai agents",
  "vector embeddings explained",
  "in-memory graph database",
  "graph database use cases",
  "open source vector database",
  "neo4j alternative",
  "vector database benchmark",
  "graphrag vs vector db",
  "what is a graph database",
  "cypher query language",
  "property graph model",
  "similarity search database",
  "retrieval augmented generation database",
  "graph database for llm",
  "vector index hnsw",
  "distributed graph database",
  "graph database vs relational database",
  "semantic search database",
  "embedding database for ai",
  "real-time graph analytics",
  "graph traversal query",
  "vector database pricing",
  "managed graph database",
  "graph database scalability",
  "ai agent memory database",
  "hybrid search ranking",
  "graph database benchmarks",
  "knowledge graph construction",
  "vector database comparison",
  "graph database for fraud detection",
  "recommendation engine database",
  "graph database api",
  "serverless vector database",
  "graph database cloud hosting",
  "approximate nearest neighbor search",
  "graph database data model",
  "rag pipeline database",
  "graph database performance",
  "vector database open source",
  "graph query optimization",
  "multi-hop reasoning database",
  "graph database enterprise",
  "vector database self-hosted",
];

const LANDING_PAGES = [
  "/product/graph-database",
  "/product/vector-search",
  "/compare/neo4j-alternative",
  "/blog/graphrag-explained",
  "/blog/hybrid-search-guide",
  "/docs/getting-started",
  "/blog/knowledge-graph-vs-vector-db",
  "/pricing",
  "/docs/api-reference",
  "/customers",
];

// --- ported from lib/constants/competitors.ts ---

const BASE_COMPETITORS: { name: string; isHydraDB?: boolean }[] = [
  { name: "HydraDB", isHydraDB: true },
  { name: "Neo4j" },
  { name: "Weaviate" },
  { name: "Qdrant" },
  { name: "Memgraph" },
  { name: "Pinecone" },
  { name: "FalkorDB" },
];

const RELATIVE_STRENGTH: Record<string, number> = {
  HydraDB: 0.55,
  Neo4j: 1,
  Weaviate: 0.72,
  Qdrant: 0.68,
  Memgraph: 0.42,
  Pinecone: 0.85,
  FalkorDB: 0.3,
};

/**
 * Ported from lib/mock-data/seo.ts, lib/mock-data/keywords.ts, and
 * lib/constants/competitors.ts so MOCK_MODE output matches the dashboard's
 * original static demo data. Each source module called faker.seed() once
 * for its own section; since we're combining three modules into one
 * client, we reseed between sections to reproduce that same determinism.
 */
export function createAhrefsMockClient(): AhrefsClient {
  async function authenticate(): Promise<void> {
    // no-op in mock mode
  }

  async function fetch(): Promise<AhrefsRawPayload> {
    // --- lib/mock-data/seo.ts (faker.seed(SEEDS.seo) -> FIXTURE_SEEDS.ahrefs) ---
    faker.seed(FIXTURE_SEEDS.ahrefs);

    const organicTrafficSeries = generateTimeSeries({
      baseValue: 1450,
      volatility: 0.13,
      trendPct: 18,
      weekendFactor: 0.85,
    });
    const organicKeywordsSeries = generateTimeSeries({ baseValue: 860, volatility: 0.02, trendPct: 24, round: true });
    const domainRatingSeries = generateTimeSeries({
      baseValue: 34,
      volatility: 0.015,
      trendPct: 15,
      minValue: 20,
      round: false,
    });
    const backlinksSeries = generateTimeSeries({ baseValue: 4200, volatility: 0.01, trendPct: 21 });
    const referringDomainsSeries = generateTimeSeries({ baseValue: 310, volatility: 0.015, trendPct: 19 });
    const newBacklinksSeries = generateTimeSeries({ baseValue: 12, volatility: 0.4, trendPct: 10, minValue: 0 });
    const lostBacklinksSeries = generateTimeSeries({ baseValue: 4, volatility: 0.5, trendPct: -5, minValue: 0 });

    const seoTopPages: SeoTopPage[] = SEO_PAGE_PATHS.map((page) => ({
      page,
      organicTraffic: faker.number.int({ min: 400, max: 5200 }),
      keywords: faker.number.int({ min: 12, max: 220 }),
      avgPosition: faker.number.float({ min: 3, max: 28, fractionDigits: 1 }),
    })).sort((a, b) => b.organicTraffic - a.organicTraffic);

    const fastestGrowingKeywords: KeywordMovement[] = FASTEST_GROWING_KEYWORDS.map((keyword) => {
      const positionChange = faker.number.int({ min: 4, max: 38 });
      const currentPosition = faker.number.int({ min: 1, max: 20 });
      return { keyword, positionChange, currentPosition };
    }).sort((a, b) => b.positionChange - a.positionChange);

    const losingKeywords: KeywordMovement[] = LOSING_KEYWORDS.map((keyword) => {
      const positionChange = -faker.number.int({ min: 3, max: 25 });
      const currentPosition = faker.number.int({ min: 8, max: 60 });
      return { keyword, positionChange, currentPosition };
    }).sort((a, b) => a.positionChange - b.positionChange);

    // --- lib/mock-data/keywords.ts (faker.seed(SEEDS.keywords) -> FIXTURE_SEEDS.keywords) ---
    faker.seed(FIXTURE_SEEDS.keywords);

    const keywordRankings: KeywordRankingRow[] = KEYWORD_TERMS.map((keyword) => {
      const previousPosition = faker.number.int({ min: 1, max: 95 });
      const drift = faker.number.int({ min: -15, max: 15 });
      const currentPosition = Math.max(1, previousPosition - drift);
      const searchVolume = faker.number.int({ min: 90, max: 14000 });
      const clicks = Math.round(searchVolume * faker.number.float({ min: 0.01, max: 0.18, fractionDigits: 3 }));
      return {
        keyword,
        currentPosition,
        previousPosition,
        movement: previousPosition - currentPosition,
        searchVolume,
        difficulty: faker.number.int({ min: 8, max: 82 }),
        clicks,
        ctr: Number(((clicks / searchVolume) * 100).toFixed(1)),
        landingPage: faker.helpers.arrayElement(LANDING_PAGES),
      };
    }).sort((a, b) => a.currentPosition - b.currentPosition);

    // --- lib/constants/competitors.ts (faker.seed(1010) is hardcoded in the
    // source module rather than drawn from FIXTURE_SEEDS; reproduced verbatim
    // here, including generating a jitter value for HydraDB before filtering
    // it out, to keep the faker call sequence identical to the source) ---
    faker.seed(1010);

    const competitorProfiles: CompetitorProfileRow[] = BASE_COMPETITORS.map((c) => {
      const strength = RELATIVE_STRENGTH[c.name];
      const jitter = faker.number.float({ min: 0.92, max: 1.08, fractionDigits: 2 });
      return {
        competitorDomain: c.name,
        isHydraDB: c.isHydraDB,
        domainRating: Math.round(30 + strength * 55 * jitter),
        backlinks: Math.round(3000 + strength * 180_000 * jitter),
        organicTraffic: Math.round(1200 + strength * 220_000 * jitter),
        // Ahrefs' CompetitorMetric table also tracks organic keyword count,
        // which lib/constants/competitors.ts doesn't produce (it only feeds
        // a domain-rating/backlinks/traffic comparison chart) -- estimated
        // proportionally to relative strength using the same jitter.
        organicKeywords: Math.round(500 + strength * 18_000 * jitter),
      };
    })
      .filter((c) => !c.isHydraDB)
      .map(({ isHydraDB: _isHydraDB, ...rest }) => rest);

    return {
      organicTraffic: latest(organicTrafficSeries),
      organicKeywords: latest(organicKeywordsSeries),
      domainRating: latest(domainRatingSeries),
      backlinks: latest(backlinksSeries),
      referringDomains: latest(referringDomainsSeries),
      newBacklinks: latest(newBacklinksSeries),
      lostBacklinks: latest(lostBacklinksSeries),
      seoTopPages,
      fastestGrowingKeywords,
      losingKeywords,
      keywordRankings,
      competitorProfiles,
    };
  }

  return { authenticate, fetch };
}
