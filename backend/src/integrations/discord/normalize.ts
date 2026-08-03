import type { DiscordMetricRecord, DiscordRawPayload } from "./types";

export async function normalize(raw: DiscordRawPayload, source: "discord" | "mock"): Promise<DiscordMetricRecord[]> {
  const byDate = new Map<string, Partial<DiscordMetricRecord>>();

  const assign = (points: { date: string; value: number }[], key: keyof DiscordMetricRecord) => {
    for (const point of points) {
      const record = byDate.get(point.date) ?? {};
      (record as Record<string, number>)[key] = point.value;
      byDate.set(point.date, record);
    }
  };

  assign(raw.memberCount, "memberCount");
  assign(raw.dau, "dau");
  assign(raw.wau, "wau");
  assign(raw.messages, "messages");

  return Array.from(byDate.entries()).map(([date, record]) => ({
    date: new Date(date),
    memberCount: record.memberCount ?? 0,
    dau: record.dau ?? 0,
    wau: record.wau ?? 0,
    messages: record.messages ?? 0,
    topChannels: raw.topChannels,
    mostActiveMembers: raw.mostActiveMembers,
    source,
  }));
}
