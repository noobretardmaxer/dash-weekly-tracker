import { z } from "zod";
import { buildListQuerySchema, compareSchema, dateRangeSchema } from "../utils/query-parser";

export const seoOverviewQuerySchema = dateRangeSchema.merge(compareSchema);
export type SeoOverviewQuery = ReturnType<typeof seoOverviewQuerySchema.parse>;

export const keywordListQuerySchema = buildListQuerySchema({ search: z.string().optional() });
export type KeywordListQuery = ReturnType<typeof keywordListQuerySchema.parse>;
