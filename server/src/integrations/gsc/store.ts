import { prisma } from "../../db/prisma-client";
import type { SearchConsoleMetricRecord } from "./types";

export async function store(records: SearchConsoleMetricRecord[]): Promise<{ count: number }> {
  await Promise.all(
    records.map((record) =>
      prisma.searchConsoleMetric.upsert({
        where: { date: record.date },
        create: record,
        update: record,
      })
    )
  );
  return { count: records.length };
}
