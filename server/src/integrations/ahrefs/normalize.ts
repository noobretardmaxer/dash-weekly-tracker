import type {
  AhrefsNormalizedBundle,
  AhrefsRawPayload,
  CompetitorMetricRecord,
  KeywordRankingRecord,
  SeoMetricRecord,
} from "./types";

function todayAtMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Ahrefs data is a point-in-time snapshot, not a client-side date range
 * series, so unlike PostHog/GSC normalize() always produces a single bundle
 * per sync run, stamped with today's date -- not one record per day in the
 * requested range.
 */
export async function normalize(
  raw: AhrefsRawPayload,
  source: "ahrefs" | "mock"
): Promise<AhrefsNormalizedBundle[]> {
  const date = todayAtMidnight();

  const seoMetric: SeoMetricRecord = {
    date,
    organicTraffic: raw.organicTraffic,
    organicKeywords: raw.organicKeywords,
    domainRating: raw.domainRating,
    backlinks: raw.backlinks,
    referringDomains: raw.referringDomains,
    newBacklinks: raw.newBacklinks,
    lostBacklinks: raw.lostBacklinks,
    topPages: raw.seoTopPages,
    fastestGrowingKeywords: raw.fastestGrowingKeywords,
    losingKeywords: raw.losingKeywords,
    source,
  };

  const keywordRankings: KeywordRankingRecord[] = raw.keywordRankings.map((row) => ({
    ...row,
    checkedAt: date,
  }));

  const competitorMetrics: CompetitorMetricRecord[] = raw.competitorProfiles.map((profile) => ({
    competitorDomain: profile.competitorDomain,
    date,
    organicTraffic: profile.organicTraffic,
    organicKeywords: profile.organicKeywords,
    domainRating: profile.domainRating,
    backlinks: profile.backlinks,
  }));

  return [{ seoMetric, keywordRankings, competitorMetrics }];
}
