import { z } from "zod";

export const updateUserRoleBodySchema = z.object({
  role: z.enum(["admin", "member"]),
});
export type UpdateUserRoleBody = z.infer<typeof updateUserRoleBodySchema>;
