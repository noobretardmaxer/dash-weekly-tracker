import { createHttpClient } from "../shared/http-client";
import { IntegrationFetchError } from "../../lib/errors";
import { env } from "../../lib/env";
import type { DailyPoint, TopTweet, TwitterClient, TwitterRawPayload } from "./types";

/**
 * Real Twitter/X integration, built against Twitter API v2
 * (https://developer.twitter.com/en/docs/twitter-api), authenticated with an
 * app-only bearer token (no user context / OAuth needed for the read-only
 * endpoints below).
 *
 * IMPORTANT LIMITATION: unlike PostHog's Query API, Twitter API v2's
 * standard access tier does not expose historical daily followers,
 * profile-visit, or engagement-rate time series -- those require either the
 * (paid, Enterprise-only) historical metrics endpoints or Twitter's
 * Analytics dashboard export, neither of which is reachable from this API
 * tier. `GET /2/users/:id` only ever returns a CURRENT snapshot of
 * `public_metrics.followers_count`, not a queryable history.
 *
 * As a result, `fetch()` below can only realistically produce a single
 * "current day" point for followers/newFollowers/mentions/profileVisits/
 * engagementRate/linkClicks -- not a full `range.from`..`range.to` series
 * like PostHog's client. `TwitterRawPayload`'s DailyPoint arrays are shaped
 * to hold just that one point when this (real) client is used. Multi-day
 * historical charts are only available in MOCK_MODE (see mock-client.ts),
 * which ports the dashboard's original fixture generator and returns a full
 * series; the README documents this as the supported way to get rich demo
 * history locally.
 */
export function createTwitterClient(): TwitterClient {
  const http = createHttpClient("https://api.twitter.com", {
    Authorization: `Bearer ${env.TWITTER_BEARER_TOKEN ?? ""}`,
  });
  const username = env.TWITTER_USERNAME;

  async function authenticate(): Promise<void> {
    if (!env.TWITTER_BEARER_TOKEN) {
      throw new IntegrationFetchError("twitter", "TWITTER_BEARER_TOKEN not configured");
    }
    try {
      await http.get(`/2/users/by/username/${username}`);
    } catch (error) {
      throw new IntegrationFetchError("twitter", (error as Error).message);
    }
  }

  async function resolveUserId(): Promise<string> {
    try {
      const { data } = await http.get(`/2/users/by/username/${username}`);
      const id = data?.data?.id;
      if (!id) {
        throw new Error(`no user found for username ${username}`);
      }
      return String(id);
    } catch (error) {
      throw new IntegrationFetchError("twitter", (error as Error).message);
    }
  }

  async function fetchFollowersCount(userId: string): Promise<number> {
    try {
      const { data } = await http.get(`/2/users/${userId}`, {
        params: { "user.fields": "public_metrics" },
      });
      return Number(data?.data?.public_metrics?.followers_count ?? 0);
    } catch (error) {
      throw new IntegrationFetchError("twitter", (error as Error).message);
    }
  }

  async function fetchMentionsCount(): Promise<number> {
    try {
      // Standard search/recent only covers the last 7 days regardless of
      // the requested range; `meta.result_count` gives us a total for that
      // window, which is the best we can do without Enterprise search.
      const { data } = await http.get(`/2/tweets/search/recent`, {
        params: { query: `from:${username} OR @${username}`, max_results: 100 },
      });
      return Array.isArray(data?.data) ? data.data.length : Number(data?.meta?.result_count ?? 0);
    } catch (error) {
      throw new IntegrationFetchError("twitter", (error as Error).message);
    }
  }

  async function fetchTopTweets(userId: string): Promise<TopTweet[]> {
    try {
      const { data } = await http.get(`/2/users/${userId}/tweets`, {
        params: { "tweet.fields": "public_metrics", max_results: 10 },
      });
      const tweets = Array.isArray(data?.data) ? data.data : [];
      return (tweets as Array<Record<string, unknown>>)
        .map((tweet) => {
          const metrics = (tweet.public_metrics ?? {}) as Record<string, number>;
          return {
            text: String(tweet.text ?? ""),
            impressions: Number(metrics.impression_count ?? 0),
            likes: Number(metrics.like_count ?? 0),
            reposts: Number(metrics.retweet_count ?? 0),
            replies: Number(metrics.reply_count ?? 0),
          };
        })
        .sort((a, b) => b.impressions - a.impressions);
    } catch (error) {
      throw new IntegrationFetchError("twitter", (error as Error).message);
    }
  }

  function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  function singlePoint(value: number): DailyPoint[] {
    return [{ date: todayIso(), value }];
  }

  async function fetch(_range: { from: Date; to: Date }): Promise<TwitterRawPayload> {
    const userId = await resolveUserId();

    const [followersCount, mentionsCount, topTweets] = await Promise.all([
      fetchFollowersCount(userId),
      fetchMentionsCount(),
      fetchTopTweets(userId),
    ]);

    // Twitter API v2 has no public endpoint for profile visits, link
    // clicks, or engagement rate (those live in Twitter Analytics, which
    // isn't part of the standard API tier). Engagement rate is
    // approximated from the fetched top tweets' public metrics instead of
    // hardcoding zero; profileVisits/linkClicks genuinely have no
    // real-API source and are reported as 0 with this comment as the
    // record of why.
    const engagementRate = topTweets.length
      ? topTweets.reduce((sum, t) => {
          const engagements = t.likes + t.reposts + t.replies;
          return sum + (t.impressions > 0 ? (engagements / t.impressions) * 100 : 0);
        }, 0) / topTweets.length
      : 0;

    return {
      followers: singlePoint(followersCount),
      // No historical snapshot to diff against within a single fetch --
      // net-new followers requires yesterday's stored value, which lives
      // in our own database, not Twitter's API. Reported as 0 here; the
      // scheduler/store layer is the right place to diff against
      // yesterday's persisted `followers` if that's needed downstream.
      newFollowers: singlePoint(0),
      mentions: singlePoint(mentionsCount),
      profileVisits: singlePoint(0),
      engagementRate: singlePoint(Number(engagementRate.toFixed(2))),
      linkClicks: singlePoint(0),
      topTweets,
    };
  }

  return { authenticate, fetch };
}
