import { prisma } from "../../db/prisma-client";
import type { WebsiteMetricRecord } from "./types";

export async function store(records: WebsiteMetricRecord[]): Promise<{ count: number }> {
  await Promise.all(
    records.map((record) =>
      prisma.websiteMetric.upsert({
        where: { date: record.date },
        create: record,
        update: record,
      })
    )
  );
  return { count: records.length };
}
