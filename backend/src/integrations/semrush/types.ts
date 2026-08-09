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
  authorityScore: number;
  backlinks: number;
};

export type RefDomainRow = { domain: string; authorityScore: number; backlinksCount: number };
export type AnchorRow = { anchor: string; backlinksCount: number; domainsCount: number };
export type TldRow = { tld: string; backlinksCount: number; domainsCount: number };
export type AuthorityBucket = { range: string; count: number };

export type SemrushRawPayload = {
  organicTraffic: number;
  organicKeywords: number;
  authorityScore: number;
  backlinks: number;
  referringDomains: number;
  newBacklinks: number;
  lostBacklinks: number;
  seoTopPages: SeoTopPage[];
  fastestGrowingKeywords: KeywordMovement[];
  losingKeywords: KeywordMovement[];
  keywordRankings: KeywordRankingRow[];
  competitorProfiles: CompetitorProfileRow[];
  refDomainsByAuthority: AuthorityBucket[];
  topRefDomains: RefDomainRow[];
  topAnchors: AnchorRow[];
  topTlds: TldRow[];
};

export interface SemrushClient {
  authenticate(): Promise<void>;
  fetch(range: { from: Date; to: Date }): Promise<SemrushRawPayload>;
}

export type SeoMetricRecord = {
  date: Date;
  organicTraffic: number;
  organicKeywords: number;
  authorityScore: number;
  backlinks: number;
  referringDomains: number;
  newBacklinks: number;
  lostBacklinks: number;
  topPages: SeoTopPage[];
  fastestGrowingKeywords: KeywordMovement[];
  losingKeywords: KeywordMovement[];
  refDomainsByAuthority: AuthorityBucket[];
  topRefDomains: RefDomainRow[];
  topAnchors: AnchorRow[];
  topTlds: TldRow[];
  // SEO data is always real Semrush now — the mock client was removed. Kept as a
  // literal (not a union) so reintroducing a "mock" source fails typecheck.
  source: "semrush";
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
  authorityScore: number;
  backlinks: number;
};

export type SemrushNormalizedBundle = {
  seoMetric: SeoMetricRecord;
  keywordRankings: KeywordRankingRecord[];
  competitorMetrics: CompetitorMetricRecord[];
};
