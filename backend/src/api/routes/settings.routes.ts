import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma-client";
import { requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { sendData } from "../utils/api-response";
import { upsertSettingBodySchema, type UpsertSettingBody } from "../schemas/settings.schema";

export const settingsRouter = Router();

settingsRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await prisma.setting.findMany();
    const settings = rows.reduce<Record<string, unknown>>((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    sendData(res, settings);
  } catch (error) {
    next(error);
  }
});

settingsRouter.put("/:key", requireRole("admin"), validateBody(upsertSettingBodySchema), async (req, res, next) => {
  try {
    const body = req.body as UpsertSettingBody;
    const value = body.value as Prisma.InputJsonValue;

    const setting = await prisma.setting.upsert({
      where: { key: req.params.key },
      create: { key: req.params.key, value },
      update: { value },
    });

    sendData(res, setting);
  } catch (error) {
    next(error);
  }
});
