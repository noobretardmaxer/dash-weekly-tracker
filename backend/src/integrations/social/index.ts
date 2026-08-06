import type { DateRange, IntegrationModule } from "../shared/types";
import { createSocialMockClient } from "./mock-client";
import { normalize as normalizeRaw } from "./normalize";
import { store as storeRecords } from "./store";
import type { SocialNormalizedBundle, SocialRawPayload } from "./types";

/**
 * Social Leaderboard (creators + their posts across platforms). No real
 * aggregation source is wired yet (a real version would combine per-platform
 * APIs — the Twitter integration plus future LinkedIn/Instagram/YouTube
 * clients), so this uses the fixture client. It runs on the scheduler + startup
 * backfill and reports through /admin/sync/status, so the Social Leaderboard
 * panel is populated in production instead of being empty everywhere.
 */
export function createSocialIntegration(): IntegrationModule<SocialRawPayload, SocialNormalizedBundle> {
  const client = createSocialMockClient();

  return {
    name: "social",
    authenticate: () => client.authenticate(),
    fetch: (range: DateRange) => client.fetch(range),
    normalize: (raw) => normalizeRaw(raw),
    store: (records) => storeRecords(records),
  };
}
