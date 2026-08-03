import { Router } from "express";
import IORedis from "ioredis";
import { prisma } from "../../db/prisma-client";
import { env } from "../../lib/env";
import { getCircuitBreakerStates } from "../../integrations/shared/circuit-breaker";

export const healthRouter = Router();

let redisClient: IORedis | undefined;
function getRedisClient(): IORedis {
  redisClient ??= new IORedis(env.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: true });
  return redisClient;
}

async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function checkRedis(): Promise<boolean> {
  try {
    const client = getRedisClient();
    if (client.status === "wait") await client.connect();
    const pong = await client.ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}

healthRouter.get("/live", (_req, res) => {
  res.json({ status: "ok" });
});

healthRouter.get("/ready", async (_req, res) => {
  const [database, redis] = await Promise.all([checkDatabase(), checkRedis()]);
  const ready = database && redis;
  res.status(ready ? 200 : 503).json({ status: ready ? "ok" : "not_ready", checks: { database, redis } });
});

healthRouter.get("/", async (_req, res) => {
  const [database, redis] = await Promise.all([checkDatabase(), checkRedis()]);
  const circuitBreakers = getCircuitBreakerStates();
  const ok = database && redis;
  res.status(ok ? 200 : 503).json({
    status: ok ? "ok" : "degraded",
    checks: { database, redis, circuitBreakers },
  });
});
