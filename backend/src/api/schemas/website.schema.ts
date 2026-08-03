import { compareSchema, dateRangeSchema } from "../utils/query-parser";

export const websiteOverviewQuerySchema = dateRangeSchema.merge(compareSchema);
export type WebsiteOverviewQuery = ReturnType<typeof websiteOverviewQuerySchema.parse>;
