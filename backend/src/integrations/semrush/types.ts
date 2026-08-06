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

export type SemrushRawPayload = {
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

export interface SemrushClient {
  authenticate(): Promise<void>;
  fetch(range: { from: Date; to: Date }): Promise<SemrushRawPayload>;
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
  source: "semrush" | "mock";
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

export type SemrushNormalizedBundle = {
  seoMetric: SeoMetricRecord;
  keywordRankings: KeywordRankingRecord[];
  competitorMetrics: CompetitorMetricRecord[];
};
