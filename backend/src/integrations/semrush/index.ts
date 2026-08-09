import type { IntegrationModule, DateRange } from "../shared/types";
import { createSemrushClient } from "./client";
import { normalize as normalizeRaw } from "./normalize";
import { store as storeRecords } from "./store";
import type { SemrushNormalizedBundle, SemrushRawPayload } from "./types";

/**
 * SEO is a real-data-only integration: there is no mock client. When
 * SEMRUSH_API_KEY is absent the client throws IntegrationNotConfiguredError and
 * the sync is recorded as skipped/degraded, so the dashboard renders honest
 * empty/stale states instead of fabricated numbers (repo policy: No Mock Data).
 */
export function createSemrushIntegration(): IntegrationModule<SemrushRawPayload, SemrushNormalizedBundle> {
  const client = createSemrushClient();

  return {
    name: "semrush",
    authenticate: () => client.authenticate(),
    fetch: (range: DateRange) => client.fetch(range),
    normalize: (raw) => normalizeRaw(raw, "semrush"),
    store: (records) => storeRecords(records),
  };
}
