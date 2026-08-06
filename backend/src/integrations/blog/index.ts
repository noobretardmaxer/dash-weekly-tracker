import type { DateRange, IntegrationModule } from "../shared/types";
import { createBlogMockClient } from "./mock-client";
import { normalize as normalizeRaw } from "./normalize";
import { store as storeRecords } from "./store";
import type { BlogNormalizedBundle, BlogRawPayload } from "./types";

/**
 * Blog/content analytics. There is no real third-party source wired yet
 * (content metrics would come from an internal CMS, or be derived from PostHog
 * pageviews on /blog/* paths — see the plan's future upgrade path), so this
 * always uses the fixture client. It is still a first-class integration: it
 * runs on the scheduler + startup backfill and reports through /admin/sync/status,
 * so the Content panel is populated in production instead of being seed-only.
 */
export function createBlogIntegration(): IntegrationModule<BlogRawPayload, BlogNormalizedBundle> {
  const client = createBlogMockClient();

  return {
    name: "blog",
    authenticate: () => client.authenticate(),
    fetch: (range: DateRange) => client.fetch(range),
    normalize: (raw) => normalizeRaw(raw, "mock"),
    store: (records) => storeRecords(records),
  };
}
