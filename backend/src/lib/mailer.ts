import nodemailer, { type Transporter } from "nodemailer";
import { env } from "./env";
import { logger } from "./logger";

const isSmtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS);

let transporter: Transporter | undefined;
function getTransporter(): Transporter {
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
}

// Mirrors this repo's integration mock-mode idiom: without SMTP credentials, invites
// still work end-to-end locally — the link is logged (and returned by the API) instead
// of emailed, so trying out auth never requires a real mail account.
export async function sendInviteEmail(to: string, inviteUrl: string): Promise<void> {
  if (!isSmtpConfigured) {
    logger.info({ to, inviteUrl }, "SMTP not configured — logging invite link instead of sending email");
    return;
  }

  await getTransporter().sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "You've been invited to HydraDB Growth Dashboard",
    text: `You've been invited to join the HydraDB Growth Dashboard. Accept your invite: ${inviteUrl}`,
    html: `<p>You've been invited to join the HydraDB Growth Dashboard.</p><p><a href="${inviteUrl}">Accept your invite</a></p>`,
  });
}
