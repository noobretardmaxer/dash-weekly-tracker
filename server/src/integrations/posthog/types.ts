export type ShareSlice = { name: string; value: number };
export type FunnelStep = { name: string; value: number };
export type DailyPoint = { date: string; value: number };

export type TopLandingPage = { page: string; visitors: number; bounceRate: number; avgTimeSeconds: number };
export type TopExitPage = { page: string; exits: number; exitRate: number };

/**
 * Shape produced by client.ts (real PostHog Query API responses, reshaped
 * into daily points) and mock-client.ts (faker fixtures) alike -- normalize()
 * only ever sees this shape, regardless of which client produced it.
 */
export type PostHogRawPayload = {
  visitors: DailyPoint[];
  uniqueVisitors: DailyPoint[];
  returningVisitors: DailyPoint[];
  signups: DailyPoint[];
  activationRate: DailyPoint[];
  avgSessionDurationSec: DailyPoint[];
  bounceRate: DailyPoint[];
  trafficSources: ShareSlice[];
  deviceBreakdown: ShareSlice[];
  countryBreakdown: ShareSlice[];
  topLandingPages: TopLandingPage[];
  topExitPages: TopExitPage[];
  activationFunnel: FunnelStep[];
  conversionFunnel: FunnelStep[];
};

export interface PostHogClient {
  authenticate(): Promise<void>;
  fetch(range: { from: Date; to: Date }): Promise<PostHogRawPayload>;
}

export type WebsiteMetricRecord = {
  date: Date;
  visitors: number;
  uniqueVisitors: number;
  returningVisitors: number;
  signups: number;
  activationRate: number;
  avgSessionDurationSec: number;
  bounceRate: number;
  trafficSources: ShareSlice[];
  deviceBreakdown: ShareSlice[];
  countryBreakdown: ShareSlice[];
  topLandingPages: TopLandingPage[];
  topExitPages: TopExitPage[];
  activationFunnel: FunnelStep[];
  conversionFunnel: FunnelStep[];
  source: "posthog" | "mock";
};
