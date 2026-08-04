import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma-client";
import { validateQuery } from "../middleware/validate";
import { sendData, sendPaginated } from "../utils/api-response";
import { resolveDateRange, resolvePreviousWindow, parseSort } from "../utils/query-parser";
import {
  socialLeaderboardOverviewQuerySchema,
  socialPostsQuerySchema,
  leaderboardQuerySchema,
  type SocialLeaderboardOverviewQuery,
  type SocialPostsQuery,
  type LeaderboardQuery,
} from "../schemas/social-leaderboard.schema";
import { buildKpiMetric, computeDeltaPct, type TimeSeriesPoint } from "../../services/analytics/growth";

export const socialLeaderboardRouter = Router();

type EngagementRow = { publishedAt: Date; likes: number; comments: number; shares: number; impressions: number };

/** Buckets raw post rows into a daily sum series, mirroring reddit.routes.ts's buildDailySeries. */
function toDailySumSeries(rows: EngagementRow[], value: (row: EngagementRow) => number): TimeSeriesPoint[] {
  const sums = new Map<string, number>();
  for (const row of rows) {
    const key = row.publishedAt.toISOString().slice(0, 10);
    sums.set(key, (sums.get(key) ?? 0) + value(row));
  }
  return Array.from(sums.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, value]) => ({ date, value }));
}

socialLeaderboardRouter.get("/", validateQuery(socialLeaderboardOverviewQuerySchema), async (req, res, next) => {
  try {
    const query = req.parsedQuery as SocialLeaderboardOverviewQuery;
    const current = resolveDateRange(query);
    const previous = resolvePreviousWindow(current, query.compare) ?? {
      from: new Date(current.from.getTime() - (current.to.getTime() - current.from.getTime())),
      to: current.from,
    };

    const [currentPosts, previousPosts] = await Promise.all([
      prisma.socialPost.findMany({
        where: { publishedAt: { gte: current.from, lte: current.to } },
        select: { publishedAt: true, likes: true, comments: true, shares: true, impressions: true, creatorId: true },
      }),
      prisma.socialPost.findMany({
        where: { publishedAt: { gte: previous.from, lte: previous.to } },
        select: { publishedAt: true, likes: true, comments: true, shares: true, impressions: true, creatorId: true },
      }),
    ]);

    const interactionsOf = (row: EngagementRow) => row.likes + row.comments + row.shares;

    const postsSeries = {
      current: toDailySumSeries(currentPosts, () => 1),
      previous: toDailySumSeries(previousPosts, () => 1),
    };
    const interactionsSeries = {
      current: toDailySumSeries(currentPosts, interactionsOf),
      previous: toDailySumSeries(previousPosts, interactionsOf),
    };
    const impressionsSeries = {
      current: toDailySumSeries(currentPosts, (row) => row.impressions),
      previous: toDailySumSeries(previousPosts, (row) => row.impressions),
    };

    const currentActiveCreatorCount = new Set(currentPosts.map((p) => p.creatorId)).size;
    const previousActiveCreatorCount = new Set(previousPosts.map((p) => p.creatorId)).size;

    const response = {
      kpis: {
        totalPosts: buildKpiMetric({
          id: "social-total-posts",
          label: "Total Posts",
          format: "number",
          current: postsSeries.current,
          previous: postsSeries.previous,
          aggregate: "sum",
          positiveIsGood: true,
        }),
        totalInteractions: buildKpiMetric({
          id: "social-total-interactions",
          label: "Total Interactions",
          format: "compact",
          current: interactionsSeries.current,
          previous: interactionsSeries.previous,
          aggregate: "sum",
          positiveIsGood: true,
        }),
        totalImpressions: buildKpiMetric({
          id: "social-total-impressions",
          label: "Total Impressions",
          format: "compact",
          current: impressionsSeries.current,
          previous: impressionsSeries.previous,
          aggregate: "sum",
          positiveIsGood: true,
        }),
        activeCreators: {
          id: "social-active-creators",
          label: "Active Creators",
          value: currentActiveCreatorCount,
          format: "number" as const,
          deltaPct: computeDeltaPct(currentActiveCreatorCount, previousActiveCreatorCount),
          positiveIsGood: true,
          series: postsSeries.current,
        },
      },
    };

    sendData(res, response, { range: current, compare: query.compare });
  } catch (error) {
    next(error);
  }
});

socialLeaderboardRouter.get("/posts", validateQuery(socialPostsQuerySchema), async (req, res, next) => {
  try {
    const query = req.parsedQuery as SocialPostsQuery;
    const current = resolveDateRange(query);

    const where: Prisma.SocialPostWhereInput = {
      publishedAt: { gte: current.from, lte: current.to },
    };
    if (query.platform) where.platform = query.platform;
    if (query.creatorId) where.creatorId = query.creatorId;

    const sort = parseSort(query.sort, ["publishedAt", "likes", "comments", "shares", "impressions"]);
    const orderBy: Prisma.SocialPostOrderByWithRelationInput = sort ? { [sort.field]: sort.direction } : { publishedAt: "desc" };

    const skip = (query.page - 1) * query.pageSize;

    const [rows, total] = await Promise.all([
      prisma.socialPost.findMany({
        where,
        orderBy,
        skip,
        take: query.pageSize,
        include: { creator: { select: { id: true, name: true, handle: true, avatarUrl: true } } },
      }),
      prisma.socialPost.count({ where }),
    ]);

    const data = rows.map((row) => ({ ...row, interactions: row.likes + row.comments + row.shares }));

    sendPaginated(res, data, { page: query.page, pageSize: query.pageSize, total }, { range: current });
  } catch (error) {
    next(error);
  }
});

type RankedCreator = {
  creator: { id: string; name: string; handle: string; avatarUrl: string | null };
  interactions: number;
  impressions: number;
  posts: number;
};

async function rankCreators(where: Prisma.SocialPostWhereInput): Promise<RankedCreator[]> {
  const groups = await prisma.socialPost.groupBy({
    by: ["creatorId"],
    where,
    _sum: { likes: true, comments: true, shares: true, impressions: true },
    _count: true,
  });
  if (groups.length === 0) return [];

  const creators = await prisma.creator.findMany({
    where: { id: { in: groups.map((g) => g.creatorId) } },
    select: { id: true, name: true, handle: true, avatarUrl: true },
  });
  const creatorById = new Map(creators.map((c) => [c.id, c]));

  return groups
    .map((g) => {
      const creator = creatorById.get(g.creatorId);
      if (!creator) return null;
      const likes = g._sum.likes ?? 0;
      const comments = g._sum.comments ?? 0;
      const shares = g._sum.shares ?? 0;
      return {
        creator,
        interactions: likes + comments + shares,
        impressions: g._sum.impressions ?? 0,
        posts: g._count,
      };
    })
    .filter((row): row is RankedCreator => row !== null);
}

socialLeaderboardRouter.get("/leaderboard", validateQuery(leaderboardQuerySchema), async (req, res, next) => {
  try {
    const query = req.parsedQuery as LeaderboardQuery;
    const current = resolveDateRange(query);
    const dayMs = 24 * 60 * 60 * 1000;
    const shifted = { from: new Date(current.from.getTime() - dayMs), to: new Date(current.to.getTime() - dayMs) };

    const baseWhere = (range: { from: Date; to: Date }): Prisma.SocialPostWhereInput => ({
      publishedAt: { gte: range.from, lte: range.to },
      ...(query.platform ? { platform: query.platform } : {}),
    });

    const [currentRows, previousRows] = await Promise.all([rankCreators(baseWhere(current)), rankCreators(baseWhere(shifted))]);

    const sorted = [...currentRows].sort((a, b) => b[query.sort] - a[query.sort]);
    // Rank movement is always relative to interactions, regardless of the current sort column,
    // since "rank" conceptually refers to the leaderboard's default interactions-based ordering.
    const previousSorted = [...previousRows].sort((a, b) => b.interactions - a.interactions);
    const previousRankByCreator = new Map(previousSorted.map((row, i) => [row.creator.id, i + 1]));

    const data = sorted.map((row, i) => {
      const rank = i + 1;
      const previousRank = previousRankByCreator.get(row.creator.id) ?? null;
      const movement = previousRank === null ? null : previousRank - rank;
      return { rank, movement, ...row };
    });

    sendData(res, data, { range: current });
  } catch (error) {
    next(error);
  }
});
