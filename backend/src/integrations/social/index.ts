import type { DateRange, IntegrationModule } from "../shared/types";
import { createSocialMockClient } from "./mock-client";
import { normalize as normalizeRaw } from "./normalize";
import { store as storeRecords } from "./store";
import { isMockMode } from "../shared/mock-mode";
import type { SocialNormalizedBundle, SocialRawPayload } from "./types";

export function createSocialIntegration(): IntegrationModule<SocialRawPayload, SocialNormalizedBundle> {
  if (!isMockMode("social")) {
    return {
      name: "social",
      authenticate: async () => {},
      fetch: async (_range: DateRange) => ({ creators: [], capturedAt: new Date().toISOString() }) as unknown as SocialRawPayload,
      normalize: async () => [],
      store: async () => ({ count: 0 }),
    };
  }

  const client = createSocialMockClient();

  return {
    name: "social",
    authenticate: () => client.authenticate(),
    fetch: (range: DateRange) => client.fetch(range),
    normalize: (raw) => normalizeRaw(raw),
    store: (records) => storeRecords(records),
  };
}
