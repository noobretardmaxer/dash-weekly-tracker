import { prisma } from "../../db/prisma-client";
import type { SocialNormalizedBundle } from "./types";

/**
 * One social sync run writes two tables: Creator (upserted by unique `handle`)
 * and SocialPost (upserted by unique `url`, linked to its creator). Creators are
 * upserted first so posts can resolve their `creatorId`. The returned count sums
 * rows written across both.
 */
export async function store(bundles: SocialNormalizedBundle[]): Promise<{ count: number }> {
  let count = 0;

  for (const bundle of bundles) {
    const creators = await Promise.all(
      bundle.creators.map((creator) =>
        prisma.creator.upsert({
          where: { handle: creator.handle },
          create: creator,
          update: { name: creator.name, avatarUrl: creator.avatarUrl },
        })
      )
    );
    count += creators.length;

    const creatorIdByHandle = new Map(creators.map((c) => [c.handle, c.id]));

    await Promise.all(
      bundle.posts.map((post) => {
        const creatorId = creatorIdByHandle.get(post.handle);
        if (!creatorId) return Promise.resolve();
        const { handle: _handle, ...rest } = post;
        const data = { ...rest, creatorId };
        return prisma.socialPost.upsert({
          where: { url: post.url },
          create: data,
          update: data,
        });
      })
    );
    count += bundle.posts.length;
  }

  return { count };
}
