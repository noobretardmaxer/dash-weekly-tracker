import { createHttpClient } from "../shared/http-client";
import { IntegrationFetchError } from "../../lib/errors";
import { env } from "../../lib/env";
import type { DiscordChannelActivity, DiscordClient, DiscordMemberActivity, DiscordRawPayload } from "./types";

/**
 * Real Discord integration, built against Discord's documented REST API.
 * https://discord.com/developers/docs/reference (base URL /api/v10, bot
 * token auth via `Authorization: Bot <token>`).
 *
 * IMPORTANT LIMITATION: like Twitter, Discord's REST API does not expose a
 * true historical daily series for member count or message count -- that
 * requires either a self-hosted bot that continuously samples and stores
 * counts over time, or a third-party analytics bot/service. There is no
 * "give me member count for each of the last 30 days" endpoint. So, unlike
 * the mock client (which returns a full historical series to back the demo
 * dashboard), this real client can only realistically return a single
 * current-day snapshot point per metric, dated at the end of the requested
 * range. A production deployment would need a scheduled job that calls this
 * client daily and lets normalize()/store() accumulate the history in
 * DiscordMetric row-by-row over time.
 */

const DISCORD_API_BASE_URL = "https://discord.com/api/v10";
const GUILD_TEXT_CHANNEL_TYPE = 0;
const MESSAGES_PAGE_SIZE = 100;
const MAX_PAGES_PER_CHANNEL = 2;
const MAX_CHANNELS_SAMPLED = 5;
const MAX_MEMBERS_SAMPLED = 10;

type DiscordGuildResponse = {
  approximate_member_count?: number;
  approximate_presence_count?: number;
};

type DiscordWidgetResponse = {
  presence_count?: number;
  members?: { id: string; username: string }[];
};

type DiscordChannelResponse = { id: string; name: string; type: number };

type DiscordMessageResponse = { id: string; author: { id: string; username: string } };

type DiscordRoleResponse = { id: string; name: string };

type DiscordMemberResponse = { roles: string[] };

export function createDiscordClient(): DiscordClient {
  const http = createHttpClient(DISCORD_API_BASE_URL, {
    Authorization: `Bot ${env.DISCORD_BOT_TOKEN ?? ""}`,
    "Content-Type": "application/json",
  });
  const guildId = env.DISCORD_GUILD_ID ?? "";

  async function authenticate(): Promise<void> {
    if (!env.DISCORD_BOT_TOKEN || !env.DISCORD_GUILD_ID) {
      throw new IntegrationFetchError("discord", "DISCORD_BOT_TOKEN / DISCORD_GUILD_ID not configured");
    }
    try {
      await http.get(`/guilds/${guildId}`);
    } catch (error) {
      throw new IntegrationFetchError("discord", (error as Error).message);
    }
  }

  /**
   * GET /guilds/{guild.id}?with_counts=true gives an approximate current
   * snapshot of member count and online ("presence") count. If the bot
   * lacks full guild access (missing permissions/intents), fall back to the
   * public widget.json, which exposes a rougher but publicly-available
   * member/presence snapshot (the server owner must have the widget enabled
   * in Server Settings > Widget for this fallback to work).
   */
  async function getGuildSnapshot(): Promise<{ memberCount: number; presenceCount: number }> {
    try {
      const { data } = await http.get<DiscordGuildResponse>(`/guilds/${guildId}`, {
        params: { with_counts: true },
      });
      return {
        memberCount: data.approximate_member_count ?? 0,
        presenceCount: data.approximate_presence_count ?? 0,
      };
    } catch (error) {
      try {
        const { data } = await http.get<DiscordWidgetResponse>(`/guilds/${guildId}/widget.json`);
        return {
          memberCount: data.members?.length ?? 0,
          presenceCount: data.presence_count ?? 0,
        };
      } catch {
        throw new IntegrationFetchError("discord", (error as Error).message);
      }
    }
  }

  async function getTextChannels(): Promise<DiscordChannelResponse[]> {
    try {
      const { data } = await http.get<DiscordChannelResponse[]>(`/guilds/${guildId}/channels`);
      return data.filter((channel) => channel.type === GUILD_TEXT_CHANNEL_TYPE);
    } catch (error) {
      throw new IntegrationFetchError("discord", (error as Error).message);
    }
  }

  /**
   * There is no single REST call that returns "message count for channel X
   * between date A and date B" -- the only way to count messages is to page
   * through GET /channels/{channel.id}/messages (100 per page, cursor-based
   * via `before`) and count them client-side, which is expensive and easy
   * to rate-limit against for servers with any real message volume. So this
   * only samples the most recent page(s) of a bounded number of channels
   * (MAX_CHANNELS_SAMPLED channels x MAX_PAGES_PER_CHANNEL pages) as a
   * best-effort, approximate read of current activity -- not an exact
   * count for the requested date range.
   */
  async function getRecentMessages(channelId: string): Promise<DiscordMessageResponse[]> {
    const collected: DiscordMessageResponse[] = [];
    let before: string | undefined;

    for (let page = 0; page < MAX_PAGES_PER_CHANNEL; page += 1) {
      try {
        const { data } = await http.get<DiscordMessageResponse[]>(`/channels/${channelId}/messages`, {
          params: { limit: MESSAGES_PAGE_SIZE, ...(before ? { before } : {}) },
        });
        if (data.length === 0) break;
        collected.push(...data);
        before = data[data.length - 1]?.id;
        if (data.length < MESSAGES_PAGE_SIZE) break;
      } catch {
        // Channel may be inaccessible to the bot (missing VIEW_CHANNEL /
        // READ_MESSAGE_HISTORY permission) -- skip it rather than failing
        // the whole fetch over one channel.
        break;
      }
    }

    return collected;
  }

  async function getGuildRoles(): Promise<DiscordRoleResponse[]> {
    try {
      const { data } = await http.get<DiscordRoleResponse[]>(`/guilds/${guildId}/roles`);
      return data;
    } catch {
      return [];
    }
  }

  async function getMemberRoleNames(userId: string, roleNameById: Map<string, string>): Promise<string[]> {
    try {
      const { data } = await http.get<DiscordMemberResponse>(`/guilds/${guildId}/members/${userId}`);
      return data.roles.map((roleId) => roleNameById.get(roleId)).filter((name): name is string => Boolean(name));
    } catch {
      return [];
    }
  }

  function isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  async function fetch(range: { from: Date; to: Date }): Promise<DiscordRawPayload> {
    const snapshotDate = isoDate(range.to);

    const { memberCount, presenceCount } = await getGuildSnapshot();
    const textChannels = await getTextChannels();
    const sampledChannels = textChannels.slice(0, MAX_CHANNELS_SAMPLED);

    const channelSamples = await Promise.all(
      sampledChannels.map(async (channel) => ({
        channel,
        messages: await getRecentMessages(channel.id),
      }))
    );

    const topChannels: DiscordChannelActivity[] = channelSamples
      .map(({ channel, messages }) => ({
        name: `#${channel.name}`,
        messages: messages.length,
        activeMembers: new Set(messages.map((message) => message.author.id)).size,
      }))
      .sort((a, b) => b.messages - a.messages);

    const messageCountByAuthor = new Map<string, { username: string; count: number }>();
    for (const { messages } of channelSamples) {
      for (const message of messages) {
        const existing = messageCountByAuthor.get(message.author.id) ?? {
          username: message.author.username,
          count: 0,
        };
        existing.count += 1;
        messageCountByAuthor.set(message.author.id, existing);
      }
    }

    const topAuthors = Array.from(messageCountByAuthor.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, MAX_MEMBERS_SAMPLED);

    const roles = await getGuildRoles();
    const roleNameById = new Map(roles.map((role) => [role.id, role.name]));

    const mostActiveMembers: DiscordMemberActivity[] = await Promise.all(
      topAuthors.map(async ([userId, { username, count }]) => ({
        username,
        messages: count,
        roles: await getMemberRoleNames(userId, roleNameById),
      }))
    );

    const totalSampledMessages = channelSamples.reduce((sum, { messages }) => sum + messages.length, 0);

    return {
      memberCount: [{ date: snapshotDate, value: memberCount }],
      // Discord has no DAU endpoint; approximate_presence_count (currently
      // online members) is the closest real signal available.
      dau: [{ date: snapshotDate, value: presenceCount }],
      // Discord has no WAU endpoint either, so DAU and WAU collapse to the
      // same current-presence snapshot value for the real client.
      wau: [{ date: snapshotDate, value: presenceCount }],
      messages: [{ date: snapshotDate, value: totalSampledMessages }],
      topChannels,
      mostActiveMembers,
    };
  }

  return { authenticate, fetch };
}
