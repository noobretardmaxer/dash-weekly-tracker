import { z } from "zod";
import { buildListQuerySchema, compareSchema, dateRangeSchema } from "../utils/query-parser";

export const blogOverviewQuerySchema = dateRangeSchema.merge(compareSchema);
export type BlogOverviewQuery = ReturnType<typeof blogOverviewQuerySchema.parse>;

export const blogPostsQuerySchema = buildListQuerySchema({
  category: z.string().optional(),
});
export type BlogPostsQuery = ReturnType<typeof blogPostsQuerySchema.parse>;
