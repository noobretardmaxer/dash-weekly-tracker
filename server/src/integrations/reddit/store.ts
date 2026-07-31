import { prisma } from "../../db/prisma-client";
import type { RedditMentionRecord } from "./types";

export async function store(records: RedditMentionRecord[]): Promise<{ count: number }> {
  const ownerNames = Array.from(new Set(records.map((r) => r.ownerName).filter((n): n is string => Boolean(n))));
  const owners = ownerNames.length
    ? await prisma.user.findMany({ where: { name: { in: ownerNames } } })
    : [];
  const ownerIdByName = new Map(owners.map((o) => [o.name, o.id]));

  await Promise.all(
    records.map((record) => {
      const { ownerName, ...rest } = record;
      const ownerId = ownerName ? ownerIdByName.get(ownerName) ?? null : null;
      const data = { ...rest, ownerId };
      return prisma.redditMention.upsert({
        where: { url: record.url },
        create: data,
        update: data,
      });
    })
  );

  return { count: records.length };
}
