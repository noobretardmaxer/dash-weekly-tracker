import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import { verifyAccessToken } from "../../lib/jwt";
import { UnauthorizedError, ForbiddenError } from "../../lib/errors";
import { prisma } from "../../db/prisma-client";

declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string; role: UserRole };
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.access_token as string | undefined;
  if (!token) {
    next(new UnauthorizedError());
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired session"));
  }
}

// Re-checks the role against the database rather than trusting the JWT's embedded role,
// since the token can outlive a role change (promotion/demotion) by up to its TTL otherwise.
export function requireRole(...roles: UserRole[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    try {
      const current = await prisma.user.findUnique({ where: { id: req.user.id }, select: { role: true } });
      if (!current || !roles.includes(current.role)) {
        next(new ForbiddenError());
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
