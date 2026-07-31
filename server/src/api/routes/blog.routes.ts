import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma-client";
import { validateQuery } from "../middleware/validate";
import { sendData, sendPaginated } from "../utils/api-response";
import { resolveDateRange, resolvePreviousWindow, parseSort } from "../utils/query-parser";
import {
  blogOverviewQuerySchema,
  blogPostsQuerySchema,
  type BlogOverviewQuery,
  type BlogPostsQuery,
} from "../schemas/blog.schema";
import { buildKpiMetric, type TimeSeriesPoint } from "../../services/analytics/growth";

export const blogRouter = Router();

function toSeries<T extends { date: Date }>(rows: T[], key: keyof T): TimeSeriesPoint[] {
  return rows.map((row) => ({ date: row.date.toISOString().slice(0, 10), value: Number(row[key]) }));
}

function inWindow(series: TimeSeriesPoint[], window: { from: Date; to: Date }): TimeSeriesPoint[] {
  const fromIso = window.from.toISOString().slice(0, 10);
  const toIso = window.to.toISOString().slice(0, 10);
  return series.filter((p) => p.date >= fromIso && p.date <= toIso);
}

blogRouter.get("/", validateQuery(blogOverviewQuerySchema), async (req, res, next) => {
  try {
    const query = req.parsedQuery as BlogOverviewQuery;
    const current = resolveDateRange(query);
    const previous = resolvePreviousWindow(current, query.compare) ?? {
      from: new Date(current.from.getTime() - (current.to.getTime() - current.from.getTime())),
      to: current.from,
    };

    const rows = await prisma.blogMetric.findMany({
      where: { date: { gte: previous.from, lte: current.to } },
      orderBy: { date: "asc" },
    });

    const buildChart = (key: "blogsPublished" | "blogVisitors" | "avgReadingTimeSec" | "contentConversions") => {
      const full = toSeries(rows, key);
      return { current: inWindow(full, current), previous: inWindow(full, previous) };
    };

    const blogVisitorsFull = toSeries(rows, "blogVisitors");
    const contentConversionsFull = toSeries(rows, "contentConversions");

    const latest = rows[rows.length - 1];

    const response = {
      kpis: {
        blogVisitors: buildKpiMetric({
          id: "blog-visitors",
          label: "Blog Visitors",
          format: "compact",
          current: inWindow(blogVisitorsFull, current),
          previous: inWindow(blogVisitorsFull, previous),
          aggregate: "sum",
          positiveIsGood: true,
        }),
        contentConversions: buildKpiMetric({
          id: "content-conversions",
          label: "Content Conversions",
          format: "number",
          current: inWindow(contentConversionsFull, current),
          previous: inWindow(contentConversionsFull, previous),
          aggregate: "sum",
          positiveIsGood: true,
        }),
      },
      charts: {
        blogsPublished: buildChart("blogsPublished"),
        blogVisitors: buildChart("blogVisitors"),
        avgReadingTimeSec: buildChart("avgReadingTimeSec"),
        contentConversions: buildChart("contentConversions"),
      },
      tables: {
        topCategories: latest?.topCategories ?? [],
      },
    };

    sendData(res, response, { range: current, compare: query.compare });
  } catch (error) {
    next(error);
  }
});

blogRouter.get("/posts", validateQuery(blogPostsQuerySchema), async (req, res, next) => {
  try {
    const query = req.parsedQuery as BlogPostsQuery;
    const current = resolveDateRange(query);

    const where: Prisma.BlogPostWhereInput = {
      capturedAt: { gte: current.from, lte: current.to },
    };
    if (query.category) where.category = query.category;

    const sort = parseSort(query.sort, ["visitors", "ctr", "conversions", "capturedAt"]);
    const orderBy: Prisma.BlogPostOrderByWithRelationInput = sort ? { [sort.field]: sort.direction } : { visitors: "desc" };

    const skip = (query.page - 1) * query.pageSize;

    const [rows, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy,
        skip,
        take: query.pageSize,
      }),
      prisma.blogPost.count({ where }),
    ]);

    sendPaginated(res, rows, { page: query.page, pageSize: query.pageSize, total }, { range: current });
  } catch (error) {
    next(error);
  }
});
