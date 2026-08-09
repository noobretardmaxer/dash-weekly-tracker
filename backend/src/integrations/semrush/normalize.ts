import type {
  SemrushNormalizedBundle,
  SemrushRawPayload,
  CompetitorMetricRecord,
  KeywordRankingRecord,
  SeoMetricRecord,
} from "./types";

function todayAtMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function normalize(
  raw: SemrushRawPayload,
  source: "semrush"
): Promise<SemrushNormalizedBundle[]> {
  const date = todayAtMidnight();

  const seoMetric: SeoMetricRecord = {
    date,
    organicTraffic: raw.organicTraffic,
    organicKeywords: raw.organicKeywords,
    authorityScore: raw.authorityScore,
    backlinks: raw.backlinks,
    referringDomains: raw.referringDomains,
    newBacklinks: raw.newBacklinks,
    lostBacklinks: raw.lostBacklinks,
    topPages: raw.seoTopPages,
    fastestGrowingKeywords: raw.fastestGrowingKeywords,
    losingKeywords: raw.losingKeywords,
    refDomainsByAuthority: raw.refDomainsByAuthority,
    topRefDomains: raw.topRefDomains,
    topAnchors: raw.topAnchors,
    topTlds: raw.topTlds,
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
    authorityScore: profile.authorityScore,
    backlinks: profile.backlinks,
  }));

  return [{ seoMetric, keywordRankings, competitorMetrics }];
}
