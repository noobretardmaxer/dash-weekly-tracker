import type { IntegrationModule, DateRange } from "../shared/types";
import { isMockMode } from "../shared/mock-mode";
import { createPostHogClient } from "./client";
import { createPostHogMockClient } from "./mock-client";
import { normalize as normalizeRaw } from "./normalize";
import { store as storeRecords } from "./store";
import type { PostHogRawPayload, WebsiteMetricRecord } from "./types";

export function createPostHogIntegration(): IntegrationModule<PostHogRawPayload, WebsiteMetricRecord> {
  const mock = isMockMode("posthog");
  const client = mock ? createPostHogMockClient() : createPostHogClient();
  const source = mock ? "mock" : "posthog";

  return {
    name: "posthog",
    authenticate: () => client.authenticate(),
    fetch: (range: DateRange) => client.fetch(range),
    normalize: (raw) => normalizeRaw(raw, source),
    store: (records) => storeRecords(records),
  };
}
