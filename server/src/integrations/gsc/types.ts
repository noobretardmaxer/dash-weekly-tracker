export type DailyPoint = { date: string; value: number };

export type QueryRow = { query: string; clicks: number; impressions: number; ctr: number; position: number };
export type PageRow = { page: string; clicks: number; impressions: number; ctr: number; position: number };
export type CountryRow = { country: string; clicks: number; impressions: number; ctr: number; position: number };
export type DeviceRow = { device: string; clicks: number; impressions: number; ctr: number; position: number };
export type SearchAppearanceRow = {
  type: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

/**
 * Shape produced by client.ts (real Google Search Console searchanalytics.query
 * API responses, reshaped into daily points and breakdown rows) and
 * mock-client.ts (faker fixtures) alike -- normalize() only ever sees this
 * shape, regardless of which client produced it.
 */
export type GscRawPayload = {
  clicks: DailyPoint[];
  impressions: DailyPoint[];
  ctr: DailyPoint[];
  avgPosition: DailyPoint[];
  topQueries: QueryRow[];
  topPages: PageRow[];
  countries: CountryRow[];
  devices: DeviceRow[];
  searchAppearance: SearchAppearanceRow[];
};

export interface GscClient {
  authenticate(): Promise<void>;
  fetch(range: { from: Date; to: Date }): Promise<GscRawPayload>;
}

export type SearchConsoleMetricRecord = {
  date: Date;
  clicks: number;
  impressions: number;
  ctr: number;
  avgPosition: number;
  topQueries: QueryRow[];
  topPages: PageRow[];
  countries: CountryRow[];
  devices: DeviceRow[];
  searchAppearance: SearchAppearanceRow[];
  source: "gsc" | "mock";
};
