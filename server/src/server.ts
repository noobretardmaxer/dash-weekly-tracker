import { createApp } from "./api/app";
import { env } from "./lib/env";
import { logger } from "./lib/logger";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, mockMode: env.MOCK_MODE }, "API server listening");
});

const shutdown = (signal: string) => {
  logger.info({ signal }, "API server shutting down");
  server.close(() => process.exit(0));
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
