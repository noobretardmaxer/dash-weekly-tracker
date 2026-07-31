import { z } from "zod";
import { buildListQuerySchema } from "../utils/query-parser";

export const reportListQuerySchema = buildListQuerySchema({
  status: z.enum(["Ready", "Generating", "Failed"]).optional(),
  type: z.string().optional(),
});
export type ReportListQuery = ReturnType<typeof reportListQuerySchema.parse>;
