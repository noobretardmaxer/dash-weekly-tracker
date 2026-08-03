import { prisma } from "../../db/prisma-client";
import type { TwitterMetricRecord } from "./types";

export async function store(records: TwitterMetricRecord[]): Promise<{ count: number }> {
  await Promise.all(
    records.map((record) =>
      prisma.twitterMetric.upsert({
        where: { date: record.date },
        create: record,
        update: record,
      })
    )
  );
  return { count: records.length };
}
