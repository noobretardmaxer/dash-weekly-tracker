import { z } from "zod";
import { compareSchema, paginationSchema } from "../utils/query-parser";

export const gscSearchTypeSchema = z.enum(["web", "image", "video", "news", "discover"]).default("web");

// GSC retains up to 16 months, so override the shared 365-day cap.
export const gscDateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  days: z.coerce.number().min(1).max(487).default(28),
});

export const gscBaseQuerySchema = z
  .object({
    property: z.string().optional(),
    searchType: gscSearchTypeSchema,
  })
  .merge(gscDateRangeSchema)
  .merge(compareSchema);
export type GscBaseQuery = z.infer<typeof gscBaseQuerySchema>;

export const gscTimeseriesQuerySchema = gscBaseQuerySchema.extend({
  granularity: z.enum(["daily", "weekly", "monthly"]).default("daily"),
});
export type GscTimeseriesQuery = z.infer<typeof gscTimeseriesQuerySchema>;

export const GSC_DIMENSIONS = ["query", "page", "country", "device", "search_appearance"] as const;
export const gscDimensionParamSchema = z.enum(GSC_DIMENSIONS);

export const gscDimensionQuerySchema = gscBaseQuerySchema.merge(paginationSchema).extend({
  sort: z
    .string()
    .regex(/^(clicks|impressions|ctr|position|value):(asc|desc)$/)
    .default("clicks:desc"),
  search: z.string().optional(),
});
export type GscDimensionQuery = z.infer<typeof gscDimensionQuerySchema>;

export const gscPropertyQuerySchema = z.object({ property: z.string().optional() });
export type GscPropertyQuery = z.infer<typeof gscPropertyQuerySchema>;

export const gscCoverageQuerySchema = z
  .object({ property: z.string().optional(), coverageState: z.string().min(1) })
  .merge(paginationSchema);
export type GscCoverageQuery = z.infer<typeof gscCoverageQuerySchema>;

export const gscUrlInspectionQuerySchema = z.object({ property: z.string().optional(), url: z.string().url() });
export type GscUrlInspectionQuery = z.infer<typeof gscUrlInspectionQuerySchema>;

export const gscSyncBodySchema = z.object({
  property: z.string().optional(),
  mode: z.enum(["daily", "backfill"]).default("daily"),
});
export type GscSyncBody = z.infer<typeof gscSyncBodySchema>;
