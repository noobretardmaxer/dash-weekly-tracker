import { z } from "zod";

export const ALLOWED_EMAIL_DOMAIN = "hydradb.com";

export function isAllowedEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginBody = z.infer<typeof loginBodySchema>;

export const inviteBodySchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["admin", "member"]),
});
export type InviteBody = z.infer<typeof inviteBodySchema>;

export const acceptInviteBodySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});
export type AcceptInviteBody = z.infer<typeof acceptInviteBodySchema>;

export const signupBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  workspaceName: z.string().min(1).max(100),
});
export type SignupBody = z.infer<typeof signupBodySchema>;
