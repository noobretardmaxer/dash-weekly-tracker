import axios from "axios";
import { createHttpClient } from "../shared/http-client";
import { IntegrationFetchError } from "../../lib/errors";
import { env } from "../../lib/env";
import type { RedditClient, RedditRawPayload, RedditRawPost } from "./types";

/**
 * Real Reddit integration, built against Reddit's documented OAuth2 script-app
 * flow (password grant) and the public search API.
 * https://www.reddit.com/dev/api#POST_search
 */
export function createRedditClient(): RedditClient {
  let accessToken: string | undefined;
  let tokenExpiresAt = 0;

  async function authenticate(): Promise<void> {
    if (!env.REDDIT_CLIENT_ID || !env.REDDIT_CLIENT_SECRET || !env.REDDIT_USERNAME || !env.REDDIT_PASSWORD) {
      throw new IntegrationFetchError("reddit", "Reddit OAuth2 credentials are not fully configured");
    }
    if (accessToken && Date.now() < tokenExpiresAt) return;

    try {
      const response = await axios.post(
        "https://www.reddit.com/api/v1/access_token",
        new URLSearchParams({
          grant_type: "password",
          username: env.REDDIT_USERNAME,
          password: env.REDDIT_PASSWORD,
        }),
        {
          auth: { username: env.REDDIT_CLIENT_ID, password: env.REDDIT_CLIENT_SECRET },
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": env.REDDIT_USER_AGENT,
          },
        }
      );
      accessToken = response.data.access_token as string;
      tokenExpiresAt = Date.now() + (Number(response.data.expires_in ?? 3600) - 60) * 1000;
    } catch (error) {
      throw new IntegrationFetchError("reddit", (error as Error).message);
    }
  }

  async function searchKeyword(keyword: string, from: Date, to: Date): Promise<RedditRawPost[]> {
    const http = createHttpClient("https://oauth.reddit.com", {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": env.REDDIT_USER_AGENT,
    });

    try {
      const { data } = await http.get("/search", {
        params: { q: keyword, sort: "new", limit: 25, restrict_sr: false },
      });

      const children = (data?.data?.children ?? []) as Array<{ data: Record<string, unknown> }>;
      const fromSec = from.getTime() / 1000;
      const toSec = to.getTime() / 1000;

      return children
        .map((child) => child.data)
        .filter((post) => {
          const createdUtc = Number(post.created_utc ?? 0);
          return createdUtc >= fromSec && createdUtc <= toSec;
        })
        .map((post) => ({
          subreddit: `r/${String(post.subreddit)}`,
          postTitle: String(post.title ?? ""),
          author: `u/${String(post.author ?? "unknown")}`,
          url: `https://reddit.com${String(post.permalink ?? "")}`,
          score: Number(post.score ?? 0),
          comments: Number(post.num_comments ?? 0),
          createdAt: new Date(Number(post.created_utc ?? 0) * 1000).toISOString().slice(0, 10),
          fullPost: String(post.selftext ?? ""),
          // Top comments require one extra call per post to /comments/{id}, which
          // is expensive at scale; left empty for the real client in v1.
          topComments: [],
          matchedKeyword: keyword,
        }));
    } catch (error) {
      throw new IntegrationFetchError("reddit", (error as Error).message);
    }
  }

  async function fetch(range: { from: Date; to: Date }, keywords: string[]): Promise<RedditRawPayload> {
    const results = await Promise.all(keywords.map((keyword) => searchKeyword(keyword, range.from, range.to)));
    return results.flat();
  }

  return { authenticate, fetch };
}
