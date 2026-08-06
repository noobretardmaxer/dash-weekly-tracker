import { createHttpClient } from "../shared/http-client";
import { IntegrationFetchError } from "../../lib/errors";
import { env } from "../../lib/env";
import type { DailyPoint, PostHogClient, PostHogRawPayload } from "./types";

/**
 * Real PostHog integration, built against PostHog's documented Query API
 * (HogQL over POST /api/projects/:id/query/). https://posthog.com/docs/api/queries
 */
export function createPostHogClient(): PostHogClient {
  const http = createHttpClient(env.POSTHOG_HOST, {
    Authorization: `Bearer ${env.POSTHOG_API_KEY ?? ""}`,
    "Content-Type": "application/json",
  });
  const projectId = env.POSTHOG_PROJECT_ID;

  async function authenticate(): Promise<void> {
    if (!env.POSTHOG_API_KEY || !projectId) {
      throw new IntegrationFetchError("posthog", "POSTHOG_API_KEY / POSTHOG_PROJECT_ID not configured");
    }
    try {
      await http.get(`/api/projects/${projectId}/`);
    } catch (error) {
      throw new IntegrationFetchError("posthog", (error as Error).message);
    }
  }

  async function runHogQL(query: string): Promise<unknown[][]> {
    try {
      const { data } = await http.post(`/api/projects/${projectId}/query/`, {
        query: { kind: "HogQLQuery", query },
      });
      return (data?.results ?? []) as unknown[][];
    } catch (error) {
      throw new IntegrationFetchError("posthog", (error as Error).message);
    }
  }

  function toDailyPoints(rows: unknown[][]): DailyPoint[] {
    return rows.map((row) => ({ date: String(row[0]), value: Number(row[1] ?? 0) }));
  }

  function isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  async function fetch(range: { from: Date; to: Date }): Promise<PostHogRawPayload> {
    const from = isoDate(range.from);
    const to = isoDate(range.to);

    const [visitorsRows, uniqueRows, returningRows, signupsRows, activationRows, sessionDurationRows, bounceRows] =
      await Promise.all([
        runHogQL(
          `SELECT toDate(timestamp) AS date, count() AS value FROM events WHERE event = '$pageview' AND timestamp >= '${from}' AND timestamp <= '${to}' GROUP BY date ORDER BY date`
        ),
        runHogQL(
          `SELECT toDate(timestamp) AS date, count(DISTINCT person_id) AS value FROM events WHERE event = '$pageview' AND timestamp >= '${from}' AND timestamp <= '${to}' GROUP BY date ORDER BY date`
        ),
        runHogQL(
          `SELECT toDate(timestamp) AS date, count(DISTINCT person_id) AS value FROM events WHERE event = '$pageview' AND timestamp >= '${from}' AND timestamp <= '${to}' AND person_id IN (SELECT person_id FROM events WHERE event = '$pageview' AND timestamp < '${from}') GROUP BY date ORDER BY date`
        ),
        runHogQL(
          `SELECT toDate(timestamp) AS date, count() AS value FROM events WHERE event = 'user_signed_up' AND timestamp >= '${from}' AND timestamp <= '${to}' GROUP BY date ORDER BY date`
        ),
        runHogQL(
          `SELECT toDate(timestamp) AS date, countIf(event = 'activated') * 100.0 / nullif(countIf(event = 'user_signed_up'), 0) AS value FROM events WHERE timestamp >= '${from}' AND timestamp <= '${to}' GROUP BY date ORDER BY date`
        ),
        runHogQL(
          `SELECT toDate(timestamp) AS date, avg(toFloat(properties.$session_duration)) AS value FROM events WHERE event = '$pageview' AND timestamp >= '${from}' AND timestamp <= '${to}' GROUP BY date ORDER BY date`
        ),
        runHogQL(
          `SELECT toDate(timestamp) AS date, countIf(properties.$session_page_count = 1) * 100.0 / nullif(count(), 0) AS value FROM events WHERE event = '$pageview' AND timestamp >= '${from}' AND timestamp <= '${to}' GROUP BY date ORDER BY date`
        ),
      ]);

    const [trafficSourceRows, deviceRows, countryRows, landingPageRows, exitPageRows] = await Promise.all([
      runHogQL(
        `SELECT properties.$referring_domain AS name, count() AS value FROM events WHERE event = '$pageview' AND timestamp >= '${from}' AND timestamp <= '${to}' GROUP BY name ORDER BY value DESC LIMIT 10`
      ),
      runHogQL(
        `SELECT properties.$device_type AS name, count() AS value FROM events WHERE event = '$pageview' AND timestamp >= '${from}' AND timestamp <= '${to}' GROUP BY name ORDER BY value DESC`
      ),
      runHogQL(
        `SELECT properties.$geoip_country_name AS name, count() AS value FROM events WHERE event = '$pageview' AND timestamp >= '${from}' AND timestamp <= '${to}' GROUP BY name ORDER BY value DESC LIMIT 10`
      ),
      runHogQL(
        `SELECT properties.$pathname AS page, count() AS visitors, avg(toFloat(properties.$session_duration)) AS avgTimeSeconds FROM events WHERE event = '$pageview' AND timestamp >= '${from}' AND timestamp <= '${to}' GROUP BY page ORDER BY visitors DESC LIMIT 8`
      ),
      runHogQL(
        `SELECT properties.$pathname AS page, count() AS exits FROM events WHERE event = '$pageleave' AND timestamp >= '${from}' AND timestamp <= '${to}' GROUP BY page ORDER BY exits DESC LIMIT 8`
      ),
    ]);

    const toShareSlices = (rows: unknown[][]): { name: string; value: number }[] =>
      rows.map((row) => ({ name: String(row[0] ?? "Unknown"), value: Number(row[1] ?? 0) }));

    return {
      visitors: toDailyPoints(visitorsRows),
      uniqueVisitors: toDailyPoints(uniqueRows),
      returningVisitors: toDailyPoints(returningRows),
      signups: toDailyPoints(signupsRows),
      activationRate: toDailyPoints(activationRows),
      avgSessionDurationSec: toDailyPoints(sessionDurationRows),
      bounceRate: toDailyPoints(bounceRows),
      trafficSources: toShareSlices(trafficSourceRows),
      deviceBreakdown: toShareSlices(deviceRows),
      countryBreakdown: toShareSlices(countryRows),
      topLandingPages: landingPageRows.map((row) => ({
        page: String(row[0]),
        visitors: Number(row[1] ?? 0),
        bounceRate: 0,
        avgTimeSeconds: Number(row[2] ?? 0),
      })),
      topExitPages: exitPageRows.map((row) => ({ page: String(row[0]), exits: Number(row[1] ?? 0), exitRate: 0 })),
      activationFunnel: [],
      conversionFunnel: [],
    };
  }

  return { authenticate, fetch };
}
