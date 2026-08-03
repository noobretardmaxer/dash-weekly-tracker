import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../lib/errors";
import { logger } from "../../lib/logger";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId: req.requestId }, "request failed");
    }
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, requestId: req.requestId },
    });
    return;
  }

  logger.error({ err, requestId: req.requestId }, "unhandled request error");
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", requestId: req.requestId },
  });
}
