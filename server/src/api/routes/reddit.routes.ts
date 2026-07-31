import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma-client";
import { validateBody, validateQuery } from "../middleware/validate";
import { sendData, sendPaginated } from "../utils/api-response";
import { resolveDateRange, resolvePreviousWindow, parseSort } from "../utils/query-parser";
import {
  redditOverviewQuerySchema,
  redditMentionsQuerySchema,
  type RedditOverviewQuery,
  type RedditMentionsQuery,
} from "../schemas/reddit.schema";
import { computeDeltaPct, type TimeSeriesPoint } from "../../services/analytics/growth";
import { NotFoundError } from "../../lib/errors";

export const redditRouter = Router();

const SENTIMENT_KEYS = ["Positive", "Neutral", "Negative"] as const;
const PRIORITY_KEYS = ["Low", "Medium", "High", "Critical"] as const;
const STATUS_KEYS = ["New", "InProgress", "Responded", "Resolved", "Ignored"] as const;

/** Groups raw mention timestamps into a daily count series for the overview sparkline. */
function buildDailySeries(rows: { mentionedAt: Date }[]): TimeSeriesPoint[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = row.mentionedAt.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, value]) => ({ date, value }));
}

function toBreakdown<TKey extends string>(
  keys: readonly TKey[],
  groups: Array<{ _count: number } & Record<string, unknown>>,
  field: string
): Record<TKey, number> {
  const breakdown = Object.fromEntries(keys.map((key) => [key, 0])) as Record<TKey, number>;
  for (const group of groups) {
    const key = group[field] as TKey;
    breakdown[key] = group._count;
  }
  return breakdown;
}

redditRouter.get("/", validateQuery(redditOverviewQuerySchema), async (req, res, next) => {
  try {
    const query = req.parsedQuery as RedditOverviewQuery;
    const current = resolveDateRange(query);
    const previous = resolvePreviousWindow(current, query.compare) ?? {
      from: new Date(current.from.getTime() - (current.to.getTime() - current.from.getTime())),
      to: current.from,
    };

    const [currentMentions, previousCount, sentimentGroups, priorityGroups, statusGroups] = await Promise.all([
      prisma.redditMention.findMany({
        where: { mentionedAt: { gte: current.from, lte: current.to } },
        select: { mentionedAt: true },
      }),
      prisma.redditMention.count({
        where: { mentionedAt: { gte: previous.from, lte: previous.to } },
      }),
      prisma.redditMention.groupBy({
        by: ["sentiment"],
        where: { mentionedAt: { gte: current.from, lte: current.to } },
        _count: true,
      }),
      prisma.redditMention.groupBy({
        by: ["priority"],
        where: { mentionedAt: { gte: current.from, lte: current.to } },
        _count: true,
      }),
      prisma.redditMention.groupBy({
        by: ["status"],
        where: { mentionedAt: { gte: current.from, lte: current.to } },
        _count: true,
      }),
    ]);

    const currentCount = currentMentions.length;
    const series = buildDailySeries(currentMentions);

    const response = {
      kpis: {
        mentions: {
          id: "reddit-mentions",
          label: "Reddit Mentions",
          value: currentCount,
          format: "compact" as const,
          deltaPct: computeDeltaPct(currentCount, previousCount),
          positiveIsGood: true,
          series,
        },
      },
      breakdowns: {
        sentimentBreakdown: toBreakdown(SENTIMENT_KEYS, sentimentGroups, "sentiment"),
        priorityBreakdown: toBreakdown(PRIORITY_KEYS, priorityGroups, "priority"),
        statusBreakdown: toBreakdown(STATUS_KEYS, statusGroups, "status"),
      },
    };

    sendData(res, response, { range: current, compare: query.compare });
  } catch (error) {
    next(error);
  }
});

redditRouter.get("/mentions", validateQuery(redditMentionsQuerySchema), async (req, res, next) => {
  try {
    const query = req.parsedQuery as RedditMentionsQuery;
    const current = resolveDateRange(query);

    const where: Prisma.RedditMentionWhereInput = {
      mentionedAt: { gte: current.from, lte: current.to },
    };
    if (query.subreddit) where.subreddit = query.subreddit;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.sentiment) where.sentiment = query.sentiment;

    const sort = parseSort(query.sort, ["mentionedAt", "score", "comments", "priority"]);
    const orderBy: Prisma.RedditMentionOrderByWithRelationInput = sort
      ? { [sort.field]: sort.direction }
      : { mentionedAt: "desc" };

    const skip = (query.page - 1) * query.pageSize;

    const [rows, total] = await Promise.all([
      prisma.redditMention.findMany({
        where,
        orderBy,
        skip,
        take: query.pageSize,
        include: { owner: { select: { id: true, name: true, initials: true } } },
      }),
      prisma.redditMention.count({ where }),
    ]);

    sendPaginated(res, rows, { page: query.page, pageSize: query.pageSize, total }, { range: current });
  } catch (error) {
    next(error);
  }
});

redditRouter.get("/mentions/:id", async (req, res, next) => {
  try {
    const mention = await prisma.redditMention.findUnique({
      where: { id: req.params.id },
      include: { owner: true },
    });

    if (!mention) {
      throw new NotFoundError(`Reddit mention ${req.params.id} not found`);
    }

    sendData(res, mention);
  } catch (error) {
    next(error);
  }
});

const updateMentionBodySchema = z.object({
  status: z.enum(["New", "InProgress", "Responded", "Resolved", "Ignored"]).optional(),
  ownerId: z.string().uuid().nullable().optional(),
});

redditRouter.patch("/mentions/:id", validateBody(updateMentionBodySchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof updateMentionBodySchema>;
    const existing = await prisma.redditMention.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError(`Reddit mention ${req.params.id} not found`);

    const statusTimeline = Array.isArray(existing.statusTimeline) ? existing.statusTimeline : [];
    const nextTimeline =
      body.status && body.status !== existing.status
        ? [...statusTimeline, { status: body.status, actor: "User", date: new Date().toISOString().slice(0, 10) }]
        : statusTimeline;

    const updated = await prisma.redditMention.update({
      where: { id: req.params.id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.ownerId !== undefined ? { ownerId: body.ownerId } : {}),
        statusTimeline: nextTimeline,
      },
      include: { owner: true },
    });

    sendData(res, updated);
  } catch (error) {
    next(error);
  }
});
