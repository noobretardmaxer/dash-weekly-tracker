import { z } from "zod";

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginBody = z.infer<typeof loginBodySchema>;

export const inviteBodySchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["admin", "editor", "viewer"]),
});
export type InviteBody = z.infer<typeof inviteBodySchema>;

export const acceptInviteBodySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});
export type AcceptInviteBody = z.infer<typeof acceptInviteBodySchema>;
