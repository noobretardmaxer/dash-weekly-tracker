import type { IntegrationModule, DateRange } from "../shared/types";
import { isMockMode } from "../shared/mock-mode";
import { createSemrushClient } from "./client";
import { createSemrushMockClient } from "./mock-client";
import { normalize as normalizeRaw } from "./normalize";
import { store as storeRecords } from "./store";
import type { SemrushNormalizedBundle, SemrushRawPayload } from "./types";

export function createSemrushIntegration(): IntegrationModule<SemrushRawPayload, SemrushNormalizedBundle> {
  const mock = isMockMode("semrush");
  const client = mock ? createSemrushMockClient() : createSemrushClient();
  const source = mock ? "mock" : "semrush";

  return {
    name: "semrush",
    authenticate: () => client.authenticate(),
    fetch: (range: DateRange) => client.fetch(range),
    normalize: (raw) => normalizeRaw(raw, source),
    store: (records) => storeRecords(records),
  };
}
