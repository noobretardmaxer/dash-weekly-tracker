import { compareSchema, dateRangeSchema } from "../utils/query-parser";

export const discordOverviewQuerySchema = dateRangeSchema.merge(compareSchema);
export type DiscordOverviewQuery = ReturnType<typeof discordOverviewQuerySchema.parse>;
