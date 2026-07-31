import { faker } from "@faker-js/faker";

faker.seed(1010);

export type CompetitorProfile = {
  name: string;
  domainRating: number;
  backlinks: number;
  referringDomains: number;
  estOrganicTraffic: number;
  isHydraDB?: boolean;
};

const BASE_COMPETITORS: Omit<CompetitorProfile, "domainRating" | "backlinks" | "referringDomains" | "estOrganicTraffic">[] = [
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

export const COMPETITORS: CompetitorProfile[] = BASE_COMPETITORS.map((c) => {
  const strength = RELATIVE_STRENGTH[c.name];
  const jitter = faker.number.float({ min: 0.92, max: 1.08, fractionDigits: 2 });
  return {
    ...c,
    domainRating: Math.round(30 + strength * 55 * jitter),
    backlinks: Math.round(3000 + strength * 180_000 * jitter),
    referringDomains: Math.round(200 + strength * 9000 * jitter),
    estOrganicTraffic: Math.round(1200 + strength * 220_000 * jitter),
  };
});
