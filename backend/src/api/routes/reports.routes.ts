import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma-client";
import { validateQuery } from "../middleware/validate";
import { sendData, sendPaginated } from "../utils/api-response";
import { parseSort } from "../utils/query-parser";
import { NotFoundError } from "../../lib/errors";
import { reportListQuerySchema, type ReportListQuery } from "../schemas/reports.schema";

export const reportsRouter = Router();

reportsRouter.get("/", validateQuery(reportListQuerySchema), async (req, res, next) => {
  try {
    const query = req.parsedQuery as ReportListQuery;

    const where: Prisma.ReportWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    const sort = parseSort(query.sort, ["createdAt", "name", "type"]) ?? { field: "createdAt", direction: "desc" as const };
    const orderBy = { [sort.field]: sort.direction } as Prisma.ReportOrderByWithRelationInput;
    const skip = (query.page - 1) * query.pageSize;

    const [rows, total] = await Promise.all([
      prisma.report.findMany({
        where,
        select: { id: true, name: true, type: true, status: true, createdAt: true },
        orderBy,
        skip,
        take: query.pageSize,
      }),
      prisma.report.count({ where }),
    ]);

    sendPaginated(res, rows, { page: query.page, pageSize: query.pageSize, total });
  } catch (error) {
    next(error);
  }
});

reportsRouter.get("/latest", async (req, res, next) => {
  try {
    const report = await prisma.report.findFirst({ where: { status: "Ready" }, orderBy: { createdAt: "desc" } });
    if (!report) {
      throw new NotFoundError("No executive report has been generated yet");
    }
    sendData(res, report);
  } catch (error) {
    next(error);
  }
});

reportsRouter.get("/:id", async (req, res, next) => {
  try {
    const report = await prisma.report.findUnique({ where: { id: req.params.id } });
    if (!report) {
      throw new NotFoundError("Report not found");
    }
    sendData(res, report);
  } catch (error) {
    next(error);
  }
});
