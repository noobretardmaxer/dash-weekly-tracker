import type { PostHogRawPayload, WebsiteMetricRecord } from "./types";

export async function normalize(raw: PostHogRawPayload, source: "posthog" | "mock"): Promise<WebsiteMetricRecord[]> {
  const byDate = new Map<string, Partial<WebsiteMetricRecord>>();

  const assign = (points: { date: string; value: number }[], key: keyof WebsiteMetricRecord) => {
    for (const point of points) {
      const record = byDate.get(point.date) ?? {};
      (record as Record<string, number>)[key] = point.value;
      byDate.set(point.date, record);
    }
  };

  assign(raw.visitors, "visitors");
  assign(raw.uniqueVisitors, "uniqueVisitors");
  assign(raw.returningVisitors, "returningVisitors");
  assign(raw.signups, "signups");
  assign(raw.activationRate, "activationRate");
  assign(raw.avgSessionDurationSec, "avgSessionDurationSec");
  assign(raw.bounceRate, "bounceRate");

  return Array.from(byDate.entries()).map(([date, record]) => ({
    date: new Date(date),
    visitors: record.visitors ?? 0,
    uniqueVisitors: record.uniqueVisitors ?? 0,
    returningVisitors: record.returningVisitors ?? 0,
    signups: record.signups ?? 0,
    activationRate: record.activationRate ?? 0,
    avgSessionDurationSec: record.avgSessionDurationSec ?? 0,
    bounceRate: record.bounceRate ?? 0,
    trafficSources: raw.trafficSources,
    deviceBreakdown: raw.deviceBreakdown,
    countryBreakdown: raw.countryBreakdown,
    topLandingPages: raw.topLandingPages,
    topExitPages: raw.topExitPages,
    activationFunnel: raw.activationFunnel,
    conversionFunnel: raw.conversionFunnel,
    source,
  }));
}
