import { z } from "zod";
import { buildListQuerySchema, compareSchema, dateRangeSchema } from "../utils/query-parser";

export const redditOverviewQuerySchema = dateRangeSchema.merge(compareSchema);
export type RedditOverviewQuery = ReturnType<typeof redditOverviewQuerySchema.parse>;

export const redditMentionsQuerySchema = buildListQuerySchema({
  subreddit: z.string().optional(),
  status: z.enum(["New", "InProgress", "Responded", "Resolved", "Ignored"]).optional(),
  priority: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
  sentiment: z.enum(["Positive", "Neutral", "Negative"]).optional(),
});
export type RedditMentionsQuery = ReturnType<typeof redditMentionsQuerySchema.parse>;
