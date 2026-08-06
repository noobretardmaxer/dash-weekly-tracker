import { faker } from "@faker-js/faker";
import { FIXTURE_SEEDS } from "../shared/fixtures/time-series";
import type { SocialClient, SocialCreatorRaw, SocialPlatformValue, SocialPostRaw, SocialRawPayload } from "./types";

const CREATORS: SocialCreatorRaw[] = [
  { name: "Sayandeep Das", handle: "@sayandeep", avatarUrl: null },
  { name: "Priya Raman", handle: "@priyaraman", avatarUrl: null },
  { name: "Jordan Kim", handle: "@jordankim", avatarUrl: null },
  { name: "Alex Chen", handle: "@alexchen", avatarUrl: null },
  { name: "Morgan Lee", handle: "@morganlee", avatarUrl: null },
  { name: "Fatima Qureshi", handle: "@fatimaq", avatarUrl: null },
  { name: "Dana (DevRel)", handle: "@devreldana", avatarUrl: null },
  { name: "GraphGuru", handle: "@graphguru", avatarUrl: null },
];

const PLATFORMS: SocialPlatformValue[] = ["twitter", "linkedin", "instagram", "youtube"];

const CONTENT_TEMPLATES = [
  "Just shipped GraphRAG with HydraDB — graph + vector retrieval in a single query. Thread 🧵",
  "Why your RAG stack needs a graph database, not just a vector store.",
  "Benchmarking HydraDB vs Neo4j on a 200M-node graph. Results inside.",
  "Migrated our AI agent memory layer to HydraDB this week. Latency down 40%.",
  "Hybrid search (vector + keyword) explained in 60 seconds.",
  "HydraDB now supports time-travel queries. Here's what that unlocks.",
  "Live demo: multi-hop reasoning over a knowledge graph with HydraDB.",
  "Fraud detection patterns using graph analytics — new walkthrough.",
];

const TOTAL_POSTS = 320;

/**
 * Fixture social leaderboard data. Deterministic given the date range (faker is
 * re-seeded per fetch and post URLs are index-based) so repeated syncs upsert
 * the same rows by their unique `url` instead of accumulating duplicates.
 */
export function createSocialMockClient(): SocialClient {
  async function authenticate(): Promise<void> {
    // no-op: fixture source, no credentials
  }

  async function fetch(range: { from: Date; to: Date }): Promise<SocialRawPayload> {
    faker.seed(FIXTURE_SEEDS.social);

    const span = Math.max(0, range.to.getTime() - range.from.getTime());

    const posts: SocialPostRaw[] = Array.from({ length: TOTAL_POSTS }, (_, i) => {
      const creator = CREATORS[i % CREATORS.length];
      const platform = PLATFORMS[i % PLATFORMS.length];
      const publishedAt = new Date(range.from.getTime() + Math.floor((i / TOTAL_POSTS) * span)).toISOString();
      const impressions = faker.number.int({ min: 500, max: 90_000 });
      const likes = faker.number.int({ min: 5, max: Math.max(6, Math.round(impressions * 0.05)) });
      const comments = faker.number.int({ min: 0, max: Math.max(1, Math.round(likes * 0.2)) });
      const shares = faker.number.int({ min: 0, max: Math.max(1, Math.round(likes * 0.3)) });
      const handleSlug = creator.handle.replace("@", "");

      return {
        handle: creator.handle,
        platform,
        content: faker.helpers.arrayElement(CONTENT_TEMPLATES),
        url: `https://social.hydradb.dev/${platform}/${handleSlug}/${i}`,
        publishedAt,
        likes,
        comments,
        shares,
        impressions,
      };
    });

    return { creators: CREATORS, posts };
  }

  return { authenticate, fetch };
}
