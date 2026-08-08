import { JWT } from "google-auth-library";
import { createHttpClient } from "../shared/http-client";
import { IntegrationFetchError } from "../../lib/errors";
import { env } from "../../lib/env";
import type {
  CountryRow,
  DailyPoint,
  DeviceRow,
  GscClient,
  GscRawPayload,
  PageRow,
  QueryRow,
  SearchAppearanceRow,
} from "./types";

type SearchAnalyticsRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

type SearchAnalyticsResponse = {
  rows?: SearchAnalyticsRow[];
};

/**
 * Real Google Search Console integration, built against the documented
 * Webmasters API v3 `searchAnalytics/query` endpoint.
 * https://developers.google.com/webmaster-tools/v1/searchanalytics/query
 */
export function createGscClient(): GscClient {
  const http = createHttpClient("https://www.googleapis.com");

  const privateKey = env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

  const jwtClient = new JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });

  async function authenticate(): Promise<void> {
    if (!env.GSC_SITE_URL || !env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
      throw new IntegrationFetchError(
        "gsc",
        "GSC_SITE_URL / GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY not configured"
      );
    }
    try {
      await jwtClient.authorize();
    } catch (error) {
      throw new IntegrationFetchError("gsc", (error as Error).message);
    }
  }

  async function query(
    startDate: string,
    endDate: string,
    dimensions: string[],
    rowLimit: number
  ): Promise<SearchAnalyticsRow[]> {
    try {
      const { token } = await jwtClient.getAccessToken();
      const siteUrl = encodeURIComponent(env.GSC_SITE_URL ?? "");
      const { data } = await http.post<SearchAnalyticsResponse>(
        `/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`,
        { startDate, endDate, dimensions, rowLimit },
        { headers: { Authorization: `Bearer ${token ?? ""}` } }
      );
      return data.rows ?? [];
    } catch (error) {
      throw new IntegrationFetchError("gsc", (error as Error).message);
    }
  }

  function isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  function toDailyPoints(rows: SearchAnalyticsRow[], pick: (row: SearchAnalyticsRow) => number): DailyPoint[] {
    return rows.map((row) => ({ date: row.keys?.[0] ?? "", value: pick(row) }));
  }

  function toQueryRows(rows: SearchAnalyticsRow[]): QueryRow[] {
    return rows.map((row) => ({
      query: row.keys?.[0] ?? "",
      clicks: Number(row.clicks ?? 0),
      impressions: Number(row.impressions ?? 0),
      ctr: Number((row.ctr ?? 0) * 100),
      position: Number(row.position ?? 0),
    }));
  }

  function toPageRows(rows: SearchAnalyticsRow[]): PageRow[] {
    return rows.map((row) => ({
      page: row.keys?.[0] ?? "",
      clicks: Number(row.clicks ?? 0),
      impressions: Number(row.impressions ?? 0),
      ctr: Number((row.ctr ?? 0) * 100),
      position: Number(row.position ?? 0),
    }));
  }

  function toCountryRows(rows: SearchAnalyticsRow[]): CountryRow[] {
    return rows.map((row) => ({
      country: row.keys?.[0] ?? "",
      clicks: Number(row.clicks ?? 0),
      impressions: Number(row.impressions ?? 0),
      ctr: Number((row.ctr ?? 0) * 100),
      position: Number(row.position ?? 0),
    }));
  }

  function toDeviceRows(rows: SearchAnalyticsRow[]): DeviceRow[] {
    return rows.map((row) => ({
      device: row.keys?.[0] ?? "",
      clicks: Number(row.clicks ?? 0),
      impressions: Number(row.impressions ?? 0),
      ctr: Number((row.ctr ?? 0) * 100),
      position: Number(row.position ?? 0),
    }));
  }

  function toSearchAppearanceRows(rows: SearchAnalyticsRow[]): SearchAppearanceRow[] {
    return rows.map((row) => ({
      type: row.keys?.[0] ?? "",
      clicks: Number(row.clicks ?? 0),
      impressions: Number(row.impressions ?? 0),
      ctr: Number((row.ctr ?? 0) * 100),
      position: Number(row.position ?? 0),
    }));
  }

  async function fetch(range: { from: Date; to: Date }): Promise<GscRawPayload> {
    const startDate = isoDate(range.from);
    const endDate = isoDate(range.to);

    const [dateRows, queryRows, pageRows, countryRows, deviceRows, appearanceRows] = await Promise.all([
      query(startDate, endDate, ["date"], 25000),
      query(startDate, endDate, ["query"], 25),
      query(startDate, endDate, ["page"], 25),
      query(startDate, endDate, ["country"], 10),
      query(startDate, endDate, ["device"], 10),
      query(startDate, endDate, ["searchAppearance"], 10),
    ]);

    return {
      clicks: toDailyPoints(dateRows, (row) => Number(row.clicks ?? 0)),
      impressions: toDailyPoints(dateRows, (row) => Number(row.impressions ?? 0)),
      ctr: toDailyPoints(dateRows, (row) => Number((row.ctr ?? 0) * 100)),
      avgPosition: toDailyPoints(dateRows, (row) => Number(row.position ?? 0)),
      topQueries: toQueryRows(queryRows),
      topPages: toPageRows(pageRows),
      countries: toCountryRows(countryRows),
      devices: toDeviceRows(deviceRows),
      searchAppearance: toSearchAppearanceRows(appearanceRows),
    };
  }

  return { authenticate, fetch };
}
