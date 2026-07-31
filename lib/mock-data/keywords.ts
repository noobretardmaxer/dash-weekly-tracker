import { faker } from "@faker-js/faker";
import { SEEDS } from "./seed";
import { generateTimeSeries } from "./utils";

faker.seed(SEEDS.keywords);

/** Count of keywords ranking in the top 10 positions, tracked over time. */
export const topRankingKeywordsSeries = generateTimeSeries({
  baseValue: 34,
  volatility: 0.06,
  trendPct: 28,
});

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

export type KeywordRankingRow = {
  keyword: string;
  currentPosition: number;
  previousPosition: number;
  movement: number;
  searchVolume: number;
  difficulty: number;
  clicks: number;
  ctr: number;
  landingPage: string;
};

export const keywordRankings: KeywordRankingRow[] = KEYWORD_TERMS.map((keyword) => {
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
