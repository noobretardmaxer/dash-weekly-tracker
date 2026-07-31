import type { IntegrationModule, DateRange } from "../shared/types";
import { isMockMode } from "../shared/mock-mode";
import { createAhrefsClient } from "./client";
import { createAhrefsMockClient } from "./mock-client";
import { normalize as normalizeRaw } from "./normalize";
import { store as storeRecords } from "./store";
import type { AhrefsNormalizedBundle, AhrefsRawPayload } from "./types";

export function createAhrefsIntegration(): IntegrationModule<AhrefsRawPayload, AhrefsNormalizedBundle> {
  const mock = isMockMode("ahrefs");
  const client = mock ? createAhrefsMockClient() : createAhrefsClient();
  const source = mock ? "mock" : "ahrefs";

  return {
    name: "ahrefs",
    authenticate: () => client.authenticate(),
    fetch: (range: DateRange) => client.fetch(range),
    normalize: (raw) => normalizeRaw(raw, source),
    store: (records) => storeRecords(records),
  };
}
