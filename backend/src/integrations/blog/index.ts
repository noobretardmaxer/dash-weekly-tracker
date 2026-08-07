import type { DateRange, IntegrationModule } from "../shared/types";
import { createBlogMockClient } from "./mock-client";
import { normalize as normalizeRaw } from "./normalize";
import { store as storeRecords } from "./store";
import { isMockMode } from "../shared/mock-mode";
import type { BlogNormalizedBundle, BlogRawPayload } from "./types";

export function createBlogIntegration(): IntegrationModule<BlogRawPayload, BlogNormalizedBundle> {
  if (!isMockMode("blog")) {
    return {
      name: "blog",
      authenticate: async () => {},
      fetch: async (_range: DateRange) => ({ posts: [], capturedAt: new Date().toISOString() }) as unknown as BlogRawPayload,
      normalize: async () => [],
      store: async () => ({ count: 0 }),
    };
  }

  const client = createBlogMockClient();

  return {
    name: "blog",
    authenticate: () => client.authenticate(),
    fetch: (range: DateRange) => client.fetch(range),
    normalize: (raw) => normalizeRaw(raw, "mock"),
    store: (records) => storeRecords(records),
  };
}
