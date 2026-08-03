import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import { ValidationError } from "../../lib/errors";

declare module "express-serve-static-core" {
  interface Request {
    parsedQuery: unknown;
  }
}

export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(new ValidationError("Invalid query parameters", result.error.flatten()));
      return;
    }
    req.parsedQuery = result.data;
    next();
  };
}

export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new ValidationError("Invalid request body", result.error.flatten()));
      return;
    }
    req.body = result.data;
    next();
  };
}
