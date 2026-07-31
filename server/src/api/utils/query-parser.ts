import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(200).default(25),
});

export const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  days: z.coerce.number().min(1).max(365).default(30),
});

export const sortSchema = z.object({
  sort: z
    .string()
    .regex(/^[a-zA-Z_]+:(asc|desc)$/)
    .optional(),
});

export const compareSchema = z.object({
  compare: z.enum(["none", "previous_period", "previous_year"]).default("previous_period"),
});

/** Builds the standard list-query schema (pagination + date-range + sort + compare), extended with route-specific filters. */
export function buildListQuerySchema<TFilters extends z.ZodRawShape>(filters?: TFilters) {
  return paginationSchema.merge(dateRangeSchema).merge(sortSchema).merge(compareSchema).extend(filters ?? ({} as TFilters));
}

export type ResolvedDateRange = { from: Date; to: Date };

/** Turns `days`/`from`/`to` query params into a concrete date range, defaulting to the last `days` days ending today. */
export function resolveDateRange(query: { from?: Date; to?: Date; days: number }): ResolvedDateRange {
  if (query.from && query.to) return { from: query.from, to: query.to };
  const to = query.to ?? new Date();
  const from = query.from ?? new Date(to.getTime() - query.days * 24 * 60 * 60 * 1000);
  return { from, to };
}

/** The equal-length window immediately preceding the current range — mirrors getPreviousPeriod from the frontend's original mock-data/utils.ts. */
export function resolvePreviousWindow(current: ResolvedDateRange, compare: "none" | "previous_period" | "previous_year"): ResolvedDateRange | null {
  if (compare === "none") return null;
  const durationMs = current.to.getTime() - current.from.getTime();

  if (compare === "previous_year") {
    return {
      from: new Date(current.from.getTime() - 365 * 24 * 60 * 60 * 1000),
      to: new Date(current.to.getTime() - 365 * 24 * 60 * 60 * 1000),
    };
  }

  return { from: new Date(current.from.getTime() - durationMs), to: new Date(current.from.getTime()) };
}

export function parseSort(sort: string | undefined, allowedFields: string[]): { field: string; direction: "asc" | "desc" } | null {
  if (!sort) return null;
  const [field, direction] = sort.split(":");
  if (!allowedFields.includes(field)) return null;
  return { field, direction: direction === "desc" ? "desc" : "asc" };
}
