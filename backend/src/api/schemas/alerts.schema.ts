import { z } from "zod";
import { buildListQuerySchema } from "../utils/query-parser";

export const alertListQuerySchema = buildListQuerySchema({
  status: z.enum(["open", "acknowledged", "resolved"]).optional(),
  type: z
    .enum(["traffic_drop", "keyword_drop", "backlinks_lost", "activation_drop", "signups_drop", "mention_spike"])
    .optional(),
  severity: z.enum(["info", "warning", "critical"]).optional(),
});
export type AlertListQuery = ReturnType<typeof alertListQuerySchema.parse>;

export const updateAlertStatusBodySchema = z.object({
  status: z.enum(["acknowledged", "resolved"]),
});
export type UpdateAlertStatusBody = ReturnType<typeof updateAlertStatusBodySchema.parse>;
