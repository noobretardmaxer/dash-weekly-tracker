export type SeoTopPage = { page: string; organicTraffic: number; keywords: number; avgPosition: number };
export type KeywordMovement = { keyword: string; positionChange: number; currentPosition: number };

export type KeywordRankingRow = {
  keyword: string;
  currentPosition: number;
  previousPosition: number;
  movement: number;
  searchVolume: number;
  difficulty: number;
  clicks: number;
  ctr: number;
  landingPage: string;
};

export type CompetitorProfileRow = {
  competitorDomain: string;
  organicTraffic: number;
  organicKeywords: number;
  domainRating: number;
  backlinks: number;
};

/**
 * Shape produced by client.ts (real Ahrefs API v3 responses, reshaped) and
 * mock-client.ts (faker fixtures) alike -- normalize() only ever sees this
 * shape, regardless of which client produced it.
 *
 * Unlike PostHog/GSC, Ahrefs' API returns point-in-time snapshot metrics for
 * a target domain (not a client-side date range series), so the scalar
 * fields below are "as of now" values rather than daily series.
 */
export type AhrefsRawPayload = {
  organicTraffic: number;
  organicKeywords: number;
  domainRating: number;
  backlinks: number;
  referringDomains: number;
  newBacklinks: number;
  lostBacklinks: number;
  seoTopPages: SeoTopPage[];
  fastestGrowingKeywords: KeywordMovement[];
  losingKeywords: KeywordMovement[];
  keywordRankings: KeywordRankingRow[];
  competitorProfiles: CompetitorProfileRow[];
};

export interface AhrefsClient {
  authenticate(): Promise<void>;
  fetch(range: { from: Date; to: Date }): Promise<AhrefsRawPayload>;
}

export type SeoMetricRecord = {
  date: Date;
  organicTraffic: number;
  organicKeywords: number;
  domainRating: number;
  backlinks: number;
  referringDomains: number;
  newBacklinks: number;
  lostBacklinks: number;
  topPages: SeoTopPage[];
  fastestGrowingKeywords: KeywordMovement[];
  losingKeywords: KeywordMovement[];
  source: "ahrefs" | "mock";
};

export type KeywordRankingRecord = {
  keyword: string;
  currentPosition: number;
  previousPosition: number;
  movement: number;
  searchVolume: number;
  difficulty: number;
  clicks: number;
  ctr: number;
  landingPage: string;
  checkedAt: Date;
};

export type CompetitorMetricRecord = {
  competitorDomain: string;
  date: Date;
  organicTraffic: number;
  organicKeywords: number;
  domainRating: number;
  backlinks: number;
};

/**
 * Ahrefs is unusual among these integrations: one sync run must write to
 * three Prisma tables (SeoMetric, KeywordRanking, CompetitorMetric), not
 * one. normalize() returns an array of this composite bundle type -- in
 * practice always a single element per sync run, since Ahrefs data is a
 * snapshot, not a genuine multi-day series from a single API call.
 */
export type AhrefsNormalizedBundle = {
  seoMetric: SeoMetricRecord;
  keywordRankings: KeywordRankingRecord[];
  competitorMetrics: CompetitorMetricRecord[];
};
