import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import { logger } from "../lib/logger";
import { requestId } from "./middleware/request-id";
import { requireAuth } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";
import { apiRouter } from "./routes";
import { healthRouter } from "./routes/health.routes";
import { authRouter } from "./routes/auth.routes";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req as express.Request).requestId,
      customLogLevel: (_req, res) => (res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info"),
    })
  );

  const openApiPath = path.join(__dirname, "..", "..", "openapi", "openapi.json");
  if (fs.existsSync(openApiPath)) {
    const openApiDoc = JSON.parse(fs.readFileSync(openApiPath, "utf-8"));
    app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(openApiDoc));
  }

  // Health and auth are public; every other route requires a logged-in session.
  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1", requireAuth, apiRouter);

  app.use(errorHandler);

  return app;
}
