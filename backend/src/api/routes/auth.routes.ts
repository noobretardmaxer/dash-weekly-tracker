import { randomUUID } from "crypto";
import { Router, type Response } from "express";
import type { User, UserRole } from "@prisma/client";
import { prisma } from "../../db/prisma-client";
import { validateBody } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import { sendData } from "../utils/api-response";
import { hashPassword, verifyPassword } from "../../lib/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken, refreshTokenExpiry } from "../../lib/jwt";
import { generateOpaqueToken, hashToken } from "../../lib/tokens";
import { sendInviteEmail } from "../../lib/mailer";
import { env } from "../../lib/env";
import { UnauthorizedError, ValidationError } from "../../lib/errors";
import {
  loginBodySchema,
  inviteBodySchema,
  acceptInviteBodySchema,
  type LoginBody,
  type InviteBody,
  type AcceptInviteBody,
} from "../schemas/auth.schema";

export const authRouter = Router();

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie(ACCESS_COOKIE, accessToken, { ...cookieOptions, maxAge: env.JWT_ACCESS_TTL_MIN * 60 * 1000 });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...cookieOptions, maxAge: env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000 });
}

function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, cookieOptions);
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
}

function publicUser(user: User) {
  return { id: user.id, email: user.email, name: user.name, initials: user.initials, role: user.role };
}

async function issueSession(res: Response, user: { id: string; role: UserRole }): Promise<void> {
  const jti = randomUUID();
  const refreshToken = signRefreshToken({ sub: user.id, jti });
  await prisma.refreshToken.create({
    data: { id: jti, userId: user.id, tokenHash: hashToken(refreshToken), expiresAt: refreshTokenExpiry() },
  });
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  setAuthCookies(res, accessToken, refreshToken);
}

authRouter.post("/login", validateBody(loginBodySchema), async (req, res, next) => {
  try {
    const body = req.body as LoginBody;
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !user.passwordHash || user.status !== "active") {
      next(new UnauthorizedError("Invalid email or password"));
      return;
    }
    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      next(new UnauthorizedError("Invalid email or password"));
      return;
    }
    await issueSession(res, user);
    sendData(res, publicUser(user));
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    const refreshCookie = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (refreshCookie) {
      try {
        const payload = verifyRefreshToken(refreshCookie);
        await prisma.refreshToken.updateMany({
          where: { id: payload.jti, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      } catch {
        // Token already invalid/expired — nothing left to revoke.
      }
    }
    clearAuthCookies(res);
    sendData(res, { success: true });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const refreshCookie = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!refreshCookie) {
      next(new UnauthorizedError());
      return;
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshCookie);
    } catch {
      next(new UnauthorizedError("Invalid or expired session"));
      return;
    }

    const record = await prisma.refreshToken.findUnique({ where: { id: payload.jti } });
    if (!record || record.revokedAt || record.expiresAt < new Date() || record.tokenHash !== hashToken(refreshCookie)) {
      next(new UnauthorizedError("Invalid or expired session"));
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: record.userId } });
    if (!user || user.status !== "active") {
      next(new UnauthorizedError());
      return;
    }

    // Rotate on every use: revoke the presented token and issue a fresh pair.
    await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
    await issueSession(res, user);
    sendData(res, publicUser(user));
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      next(new UnauthorizedError());
      return;
    }
    sendData(res, publicUser(user));
  } catch (error) {
    next(error);
  }
});

authRouter.post(
  "/invite",
  requireAuth,
  requireRole("admin"),
  validateBody(inviteBodySchema),
  async (req, res, next) => {
    try {
      const body = req.body as InviteBody;
      const existing = await prisma.user.findUnique({ where: { email: body.email } });
      if (existing) {
        next(new ValidationError("A user with this email already exists"));
        return;
      }

      const rawToken = generateOpaqueToken();
      const initials = body.name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      const user = await prisma.user.create({
        data: {
          email: body.email,
          name: body.name,
          initials,
          role: body.role,
          status: "pending",
          inviteTokenHash: hashToken(rawToken),
          inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          invitedById: req.user!.id,
        },
      });

      const inviteUrl = `${env.APP_URL}/accept-invite?token=${rawToken}`;
      await sendInviteEmail(user.email, inviteUrl);

      // Returning inviteUrl directly (in addition to emailing it) keeps invites usable
      // even when SMTP isn't configured, mirroring this repo's mock-mode fallback idiom.
      sendData(res, { ...publicUser(user), inviteUrl });
    } catch (error) {
      next(error);
    }
  }
);

authRouter.post("/accept-invite", validateBody(acceptInviteBodySchema), async (req, res, next) => {
  try {
    const body = req.body as AcceptInviteBody;
    const tokenHash = hashToken(body.token);
    const user = await prisma.user.findUnique({ where: { inviteTokenHash: tokenHash } });

    if (!user || user.status !== "pending" || !user.inviteExpiresAt || user.inviteExpiresAt < new Date()) {
      next(new UnauthorizedError("Invite link is invalid or has expired"));
      return;
    }

    const passwordHash = await hashPassword(body.password);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, status: "active", inviteTokenHash: null, inviteExpiresAt: null },
    });

    await issueSession(res, updated);
    sendData(res, publicUser(updated));
  } catch (error) {
    next(error);
  }
});
