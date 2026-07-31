import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import { logger } from "../lib/logger";
import { requestId } from "./middleware/request-id";
import { errorHandler } from "./middleware/error-handler";
import { apiRouter } from "./routes";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
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

  app.use("/api/v1", apiRouter);

  app.use(errorHandler);

  return app;
}
