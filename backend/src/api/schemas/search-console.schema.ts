import { compareSchema, dateRangeSchema } from "../utils/query-parser";

export const searchConsoleOverviewQuerySchema = dateRangeSchema.merge(compareSchema);
export type SearchConsoleOverviewQuery = ReturnType<typeof searchConsoleOverviewQuerySchema.parse>;
