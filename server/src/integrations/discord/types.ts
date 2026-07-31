export type DailyPoint = { date: string; value: number };

export type DiscordChannelActivity = { name: string; messages: number; activeMembers: number };
export type DiscordMemberActivity = { username: string; messages: number; roles: string[] };

/**
 * Shape produced by client.ts (real Discord REST API responses, reshaped
 * into daily points) and mock-client.ts (faker fixtures) alike -- normalize()
 * only ever sees this shape, regardless of which client produced it.
 */
export type DiscordRawPayload = {
  memberCount: DailyPoint[];
  dau: DailyPoint[];
  wau: DailyPoint[];
  messages: DailyPoint[];
  topChannels: DiscordChannelActivity[];
  mostActiveMembers: DiscordMemberActivity[];
};

export interface DiscordClient {
  authenticate(): Promise<void>;
  fetch(range: { from: Date; to: Date }): Promise<DiscordRawPayload>;
}

export type DiscordMetricRecord = {
  date: Date;
  memberCount: number;
  dau: number;
  wau: number;
  messages: number;
  topChannels: DiscordChannelActivity[];
  mostActiveMembers: DiscordMemberActivity[];
  source: "discord" | "mock";
};
