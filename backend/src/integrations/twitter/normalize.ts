import type { TwitterRawPayload, TwitterMetricRecord } from "./types";

export async function normalize(raw: TwitterRawPayload, source: "twitter" | "mock"): Promise<TwitterMetricRecord[]> {
  const byDate = new Map<string, Partial<TwitterMetricRecord>>();

  const assign = (points: { date: string; value: number }[], key: keyof TwitterMetricRecord) => {
    for (const point of points) {
      const record = byDate.get(point.date) ?? {};
      (record as Record<string, number>)[key] = point.value;
      byDate.set(point.date, record);
    }
  };

  assign(raw.followers, "followers");
  assign(raw.newFollowers, "newFollowers");
  assign(raw.mentions, "mentions");
  assign(raw.profileVisits, "profileVisits");
  assign(raw.engagementRate, "engagementRate");
  assign(raw.linkClicks, "linkClicks");

  return Array.from(byDate.entries()).map(([date, record]) => ({
    date: new Date(date),
    followers: record.followers ?? 0,
    newFollowers: record.newFollowers ?? 0,
    mentions: record.mentions ?? 0,
    profileVisits: record.profileVisits ?? 0,
    engagementRate: record.engagementRate ?? 0,
    linkClicks: record.linkClicks ?? 0,
    topTweets: raw.topTweets,
    source,
  }));
}
