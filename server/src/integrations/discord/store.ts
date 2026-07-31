import { prisma } from "../../db/prisma-client";
import type { DiscordMetricRecord } from "./types";

export async function store(records: DiscordMetricRecord[]): Promise<{ count: number }> {
  await Promise.all(
    records.map((record) =>
      prisma.discordMetric.upsert({
        where: { date: record.date },
        create: record,
        update: record,
      })
    )
  );
  return { count: records.length };
}
