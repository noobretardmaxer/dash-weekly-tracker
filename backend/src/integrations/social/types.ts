// Matches the Prisma `SocialPlatform` enum (schema.prisma).
export type SocialPlatformValue = "twitter" | "linkedin" | "instagram" | "youtube";

/**
 * Shape produced by the fixture client. There is no real aggregation source
 * wired yet (a real leaderboard would aggregate per-platform APIs — the Twitter
 * integration plus future LinkedIn/Instagram/YouTube clients), so normalize()
 * only ever sees this fixture shape.
 */
export type SocialCreatorRaw = {
  name: string;
  handle: string;
  avatarUrl: string | null;
};

export type SocialPostRaw = {
  handle: string;
  platform: SocialPlatformValue;
  content: string;
  url: string;
  publishedAt: string; // ISO datetime
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
};

export type SocialRawPayload = {
  creators: SocialCreatorRaw[];
  posts: SocialPostRaw[];
};

export interface SocialClient {
  authenticate(): Promise<void>;
  fetch(range: { from: Date; to: Date }): Promise<SocialRawPayload>;
}

export type SocialCreatorRecord = {
  name: string;
  handle: string;
  avatarUrl: string | null;
};

export type SocialPostRecord = {
  handle: string;
  platform: SocialPlatformValue;
  content: string;
  url: string;
  publishedAt: Date;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
};

/**
 * One social sync run writes two Prisma tables: Creator (upserted by unique
 * `handle`) and SocialPost (upserted by unique `url`, linked to its creator).
 * normalize() returns a single composite bundle, mirroring the Ahrefs pattern.
 */
export type SocialNormalizedBundle = {
  creators: SocialCreatorRecord[];
  posts: SocialPostRecord[];
};
