import type { DateRange, IntegrationModule } from "../shared/types";
import { isMockMode } from "../shared/mock-mode";
import { prisma } from "../../db/prisma-client";
import { createRedditClient } from "./client";
import { createRedditMockClient } from "./mock-client";
import { normalize as normalizeRaw } from "./normalize";
import { store as storeRecords } from "./store";
import type { RedditMentionRecord, RedditRawPayload } from "./types";

export const DEFAULT_REDDIT_KEYWORDS = [
  "HydraDB",
  "GraphRAG",
  "Knowledge Graph",
  "Context Graph",
  "Graph Database",
  "AI Agent Memory",
];

async function resolveKeywords(): Promise<string[]> {
  const setting = await prisma.setting.findUnique({ where: { key: "reddit.keywords" } });
  const value = setting?.value;
  if (Array.isArray(value) && value.every((v) => typeof v === "string") && value.length > 0) {
    return value as string[];
  }
  return DEFAULT_REDDIT_KEYWORDS;
}

export function createRedditIntegration(): IntegrationModule<RedditRawPayload, RedditMentionRecord> {
  const mock = isMockMode("reddit");
  const client = mock ? createRedditMockClient() : createRedditClient();

  return {
    name: "reddit",
    authenticate: () => client.authenticate(),
    fetch: async (range: DateRange) => {
      const keywords = await resolveKeywords();
      return client.fetch(range, keywords);
    },
    normalize: (raw) => normalizeRaw(raw),
    store: (records) => storeRecords(records),
  };
}
