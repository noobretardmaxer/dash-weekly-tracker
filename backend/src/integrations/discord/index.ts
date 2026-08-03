import type { IntegrationModule, DateRange } from "../shared/types";
import { isMockMode } from "../shared/mock-mode";
import { createDiscordClient } from "./client";
import { createDiscordMockClient } from "./mock-client";
import { normalize as normalizeRaw } from "./normalize";
import { store as storeRecords } from "./store";
import type { DiscordMetricRecord, DiscordRawPayload } from "./types";

export function createDiscordIntegration(): IntegrationModule<DiscordRawPayload, DiscordMetricRecord> {
  const mock = isMockMode("discord");
  const client = mock ? createDiscordMockClient() : createDiscordClient();
  const source = mock ? "mock" : "discord";

  return {
    name: "discord",
    authenticate: () => client.authenticate(),
    fetch: (range: DateRange) => client.fetch(range),
    normalize: (raw) => normalizeRaw(raw, source),
    store: (records) => storeRecords(records),
  };
}
