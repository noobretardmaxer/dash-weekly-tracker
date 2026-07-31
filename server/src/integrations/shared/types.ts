export type DateRange = { from: Date; to: Date };

/**
 * Every integration module implements this same four-step contract. A new
 * integration (GitHub, Hacker News, Product Hunt, ...) is added by creating a
 * folder that implements this interface and registering one job — nothing
 * else in the system needs to change.
 */
export interface IntegrationModule<TRaw = unknown, TNormalized = unknown> {
  name: string;
  authenticate(): Promise<void>;
  fetch(range: DateRange): Promise<TRaw>;
  normalize(raw: TRaw): Promise<TNormalized[]>;
  store(records: TNormalized[]): Promise<{ count: number }>;
}
