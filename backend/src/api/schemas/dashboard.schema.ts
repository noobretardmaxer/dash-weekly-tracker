import { compareSchema, dateRangeSchema } from "../utils/query-parser";

export const dashboardOverviewQuerySchema = dateRangeSchema.merge(compareSchema);
export type DashboardOverviewQuery = ReturnType<typeof dashboardOverviewQuerySchema.parse>;
