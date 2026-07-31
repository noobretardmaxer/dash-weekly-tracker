import type { IntegrationModule, DateRange } from "../shared/types";
import { isMockMode } from "../shared/mock-mode";
import { createTwitterClient } from "./client";
import { createTwitterMockClient } from "./mock-client";
import { normalize as normalizeRaw } from "./normalize";
import { store as storeRecords } from "./store";
import type { TwitterRawPayload, TwitterMetricRecord } from "./types";

export function createTwitterIntegration(): IntegrationModule<TwitterRawPayload, TwitterMetricRecord> {
  const mock = isMockMode("twitter");
  const client = mock ? createTwitterMockClient() : createTwitterClient();
  const source = mock ? "mock" : "twitter";

  return {
    name: "twitter",
    authenticate: () => client.authenticate(),
    fetch: (range: DateRange) => client.fetch(range),
    normalize: (raw) => normalizeRaw(raw, source),
    store: (records) => storeRecords(records),
  };
}
