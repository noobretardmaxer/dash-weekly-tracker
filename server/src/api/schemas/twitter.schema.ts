import { compareSchema, dateRangeSchema } from "../utils/query-parser";

export const twitterOverviewQuerySchema = dateRangeSchema.merge(compareSchema);
export type TwitterOverviewQuery = ReturnType<typeof twitterOverviewQuerySchema.parse>;
