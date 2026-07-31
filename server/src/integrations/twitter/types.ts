export type DailyPoint = { date: string; value: number };

export type TopTweet = { text: string; impressions: number; likes: number; reposts: number; replies: number };

/**
 * Shape produced by client.ts (real Twitter API v2 responses, reshaped into
 * daily points) and mock-client.ts (faker fixtures) alike -- normalize()
 * only ever sees this shape, regardless of which client produced it.
 *
 * NOTE: when produced by the real client, each DailyPoint array below holds
 * a single "current day" point rather than a full historical series --
 * see the comment at the top of client.ts for why.
 */
export type TwitterRawPayload = {
  followers: DailyPoint[];
  newFollowers: DailyPoint[];
  mentions: DailyPoint[];
  profileVisits: DailyPoint[];
  engagementRate: DailyPoint[];
  linkClicks: DailyPoint[];
  topTweets: TopTweet[];
};

export interface TwitterClient {
  authenticate(): Promise<void>;
  fetch(range: { from: Date; to: Date }): Promise<TwitterRawPayload>;
}

export type TwitterMetricRecord = {
  date: Date;
  followers: number;
  newFollowers: number;
  mentions: number;
  profileVisits: number;
  engagementRate: number;
  linkClicks: number;
  topTweets: TopTweet[];
  source: "twitter" | "mock";
};
