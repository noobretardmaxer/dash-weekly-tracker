import { z } from "zod";

export const upsertSettingBodySchema = z.object({
  value: z.unknown(),
});
export type UpsertSettingBody = ReturnType<typeof upsertSettingBodySchema.parse>;
