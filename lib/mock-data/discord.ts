import { faker } from "@faker-js/faker";
import { SEEDS } from "./seed";
import { generateTimeSeries } from "./utils";

faker.seed(SEEDS.discord);

export const membersSeries = generateTimeSeries({
  baseValue: 5400,
  volatility: 0.02,
  trendPct: 14,
});

export const dauSeries = generateTimeSeries({
  baseValue: 420,
  volatility: 0.15,
  trendPct: 11,
  weekendFactor: 0.85,
});

export const wauSeries = generateTimeSeries({
  baseValue: 1650,
  volatility: 0.1,
  trendPct: 13,
});

export const messagesSeries = generateTimeSeries({
  baseValue: 980,
  volatility: 0.2,
  trendPct: 17,
  weekendFactor: 0.7,
});

const CHANNEL_NAMES = [
  "#general",
  "#help",
  "#graphrag",
  "#showcase",
  "#feature-requests",
  "#announcements",
  "#vector-search",
  "#job-board",
];

export const topChannels = CHANNEL_NAMES.map((name) => ({
  name,
  messages: faker.number.int({ min: 120, max: 8200 }),
  activeMembers: faker.number.int({ min: 20, max: 640 }),
})).sort((a, b) => b.messages - a.messages);

const MEMBER_NAMES = [
  "kavya.dev", "riley_codes", "sam.builds", "priya_ml", "jordan.k", "alex_graphs",
  "morgan.vec", "chen.wei", "diego_ai", "fatima.q",
];

export const mostActiveMembers = MEMBER_NAMES.map((username) => ({
  username,
  messages: faker.number.int({ min: 80, max: 2100 }),
  roles: faker.helpers.arrayElements(["Contributor", "Beta Tester", "Moderator", "Partner"], { min: 1, max: 2 }),
})).sort((a, b) => b.messages - a.messages);
