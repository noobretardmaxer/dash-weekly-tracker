import { z } from "zod";
import { buildListQuerySchema, compareSchema, dateRangeSchema } from "../utils/query-parser";

const platformEnum = z.enum(["twitter", "linkedin", "instagram", "youtube"]);

export const socialLeaderboardOverviewQuerySchema = dateRangeSchema.merge(compareSchema);
export type SocialLeaderboardOverviewQuery = ReturnType<typeof socialLeaderboardOverviewQuerySchema.parse>;

export const socialPostsQuerySchema = buildListQuerySchema({
  platform: platformEnum.optional(),
  creatorId: z.string().uuid().optional(),
});
export type SocialPostsQuery = ReturnType<typeof socialPostsQuerySchema.parse>;

// Not buildListQuerySchema: leaderboard ranking is computed in JS over a groupBy,
// not paginated/DB-sorted, so pagination + the generic field:asc|desc sort don't apply.
export const leaderboardQuerySchema = dateRangeSchema.extend({
  sort: z.enum(["interactions", "impressions", "posts"]).default("interactions"),
  platform: platformEnum.optional(),
});
export type LeaderboardQuery = ReturnType<typeof leaderboardQuerySchema.parse>;
