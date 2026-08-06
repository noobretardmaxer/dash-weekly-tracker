import type { SocialNormalizedBundle, SocialRawPayload } from "./types";

export async function normalize(raw: SocialRawPayload): Promise<SocialNormalizedBundle[]> {
  return [
    {
      creators: raw.creators.map((c) => ({
        name: c.name,
        handle: c.handle,
        avatarUrl: c.avatarUrl ?? null,
      })),
      posts: raw.posts.map((p) => ({
        handle: p.handle,
        platform: p.platform,
        content: p.content,
        url: p.url,
        publishedAt: new Date(p.publishedAt),
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        impressions: p.impressions,
      })),
    },
  ];
}
