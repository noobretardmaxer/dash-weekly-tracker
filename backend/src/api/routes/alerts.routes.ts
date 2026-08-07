import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma-client";
import { validateBody, validateQuery } from "../middleware/validate";
import { sendData, sendPaginated } from "../utils/api-response";
import { parseSort } from "../utils/query-parser";
import { NotFoundError } from "../../lib/errors";
import {
  alertListQuerySchema,
  updateAlertStatusBodySchema,
  type AlertListQuery,
  type UpdateAlertStatusBody,
} from "../schemas/alerts.schema";

export const alertsRouter = Router();

alertsRouter.get("/", validateQuery(alertListQuerySchema), async (req, res, next) => {
  try {
    const query = req.parsedQuery as AlertListQuery;

    const where: Prisma.AlertWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.severity ? { severity: query.severity } : {}),
    };

    const sort = parseSort(query.sort, ["createdAt", "severity"]) ?? { field: "createdAt", direction: "desc" as const };
    const orderBy = { [sort.field]: sort.direction } as Prisma.AlertOrderByWithRelationInput;
    const skip = (query.page - 1) * query.pageSize;

    const [rows, total] = await Promise.all([
      prisma.alert.findMany({ where, orderBy, skip, take: query.pageSize }),
      prisma.alert.count({ where }),
    ]);

    sendPaginated(res, rows, { page: query.page, pageSize: query.pageSize, total });
  } catch (error) {
    next(error);
  }
});

alertsRouter.patch("/:id", validateBody(updateAlertStatusBodySchema), async (req, res, next) => {
  try {
    const body = req.body as UpdateAlertStatusBody;

    const data: Prisma.AlertUpdateInput = {
      status: body.status,
      ...(body.status === "resolved"
        ? { resolvedAt: new Date() }
        : {}),
    };

    const alert = await prisma.alert.update({ where: { id: req.params.id }, data });
    sendData(res, alert);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      next(new NotFoundError("Alert not found"));
      return;
    }
    next(error);
  }
});
