import type { IntegrationModule, DateRange } from "../shared/types";
import { isMockMode } from "../shared/mock-mode";
import { createGscClient } from "./client";
import { createGscMockClient } from "./mock-client";
import { normalize as normalizeRaw } from "./normalize";
import { store as storeRecords } from "./store";
import type { GscRawPayload, SearchConsoleMetricRecord } from "./types";

export function createGscIntegration(): IntegrationModule<GscRawPayload, SearchConsoleMetricRecord> {
  const mock = isMockMode("gsc");
  const client = mock ? createGscMockClient() : createGscClient();
  const source = mock ? "mock" : "gsc";

  return {
    name: "gsc",
    authenticate: () => client.authenticate(),
    fetch: (range: DateRange) => client.fetch(range),
    normalize: (raw) => normalizeRaw(raw, source),
    store: (records) => storeRecords(records),
  };
}
