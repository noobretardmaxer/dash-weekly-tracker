import { faker } from "@faker-js/faker";
import { FIXTURE_SEEDS } from "../shared/fixtures/time-series";
import type {
  RedditClient,
  RedditPriority,
  RedditRawPayload,
  RedditRawPost,
  RedditSentiment,
  RedditStatusValue,
  RedditMentionType,
  RedditTimelineEventRaw,
} from "./types";

const SUBREDDITS = [
  "r/database",
  "r/vectordatabase",
  "r/programming",
  "r/MachineLearning",
  "r/dataengineering",
  "r/webdev",
  "r/rust",
  "r/devops",
  "r/artificial",
  "r/LocalLLaMA",
];

const POST_TITLE_TEMPLATES = [
  () => `Anyone tried ${faker.helpers.arrayElement(["HydraDB", "HydraDB's hybrid search", "HydraDB for RAG"])} vs Neo4j?`,
  () => `HydraDB just saved us a rewrite — graph + vector in one query`,
  () => `Is HydraDB production ready for a ${faker.number.int({ min: 5, max: 500 })}M node graph?`,
  () => `Why does HydraDB's ingestion throughput drop under heavy write load?`,
  () => `We migrated from Pinecone + Neo4j to HydraDB, here's what changed`,
  () => `HydraDB pricing feels steep for small teams`,
  () => `Best graph database for an AI agent memory layer in 2026?`,
  () => `HydraDB GraphRAG tutorial finally clicked for me`,
  () => `Feature request: native support for time-travel queries in HydraDB`,
  () => `Bug: HydraDB driver crashes on reconnect after network blip`,
];

const SENTIMENTS: RedditSentiment[] = ["Positive", "Neutral", "Negative"];
const MENTION_TYPES: RedditMentionType[] = ["Question", "Complaint", "Comparison", "Praise", "BugReport", "FeatureRequest"];
const PRIORITIES: RedditPriority[] = ["Low", "Medium", "High", "Critical"];
const STATUSES: RedditStatusValue[] = ["New", "InProgress", "Responded", "Resolved", "Ignored"];
// Kept in sync with lib/constants/team-members.ts so seeded reddit_mentions.ownerId
// resolves against the same users the seed script creates.
const OWNER_NAMES = ["Sayandeep Das", "Priya Raman", "Jordan Kim", "Alex Chen", "Morgan Lee", "Fatima Qureshi"];

function buildTimeline(finalStatus: RedditStatusValue, owner: string): RedditTimelineEventRaw[] {
  const order: RedditStatusValue[] = ["New", "InProgress", "Responded", "Resolved"];
  const finalIndex = finalStatus === "Ignored" ? 0 : order.indexOf(finalStatus);
  const steps = finalStatus === "Ignored" ? [order[0]] : order.slice(0, finalIndex + 1);
  let daysAgo = steps.length * 2 + faker.number.int({ min: 1, max: 3 });
  return steps.map((status, i) => {
    daysAgo -= i === 0 ? 0 : faker.number.int({ min: 1, max: 3 });
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return { status, actor: i === 0 ? "System" : owner, date: date.toISOString().slice(0, 10) };
  });
}

function buildMentionRow(index: number, keywords: string[]): RedditRawPost {
  const subreddit = faker.helpers.arrayElement(SUBREDDITS);
  const postTitle = faker.helpers.arrayElement(POST_TITLE_TEMPLATES)();
  const author = `u/${faker.internet.username().toLowerCase()}`;
  const sentiment = faker.helpers.arrayElement(SENTIMENTS);
  const mentionType = faker.helpers.arrayElement(MENTION_TYPES);
  const priority = faker.helpers.arrayElement(PRIORITIES);
  const status = faker.helpers.arrayElement(STATUSES);
  const ownerName = faker.helpers.arrayElement(OWNER_NAMES);
  const createdAt = faker.date.recent({ days: 21 }).toISOString().slice(0, 10);
  const matchedKeyword = faker.helpers.arrayElement(keywords);

  return {
    subreddit,
    postTitle,
    author,
    url: `https://reddit.com/${subreddit}/comments/${faker.string.alphanumeric(6)}`,
    score: faker.number.int({ min: 1, max: 640 }),
    comments: faker.number.int({ min: 0, max: 180 }),
    createdAt,
    fullPost: faker.lorem.paragraphs({ min: 2, max: 4 }, "\n\n"),
    topComments: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => ({
      author: `u/${faker.internet.username().toLowerCase()}`,
      text: faker.lorem.sentences({ min: 1, max: 3 }),
      score: faker.number.int({ min: -4, max: 220 }),
    })).sort((a, b) => b.score - a.score),
    matchedKeyword,
    sentiment,
    mentionType,
    priority,
    status,
    ownerName,
    aiSummary: `This ${mentionType.toLowerCase()} in ${subreddit} carries ${sentiment.toLowerCase()} sentiment. The author is asking about ${faker.helpers.arrayElement(["pricing", "performance at scale", "migration effort", "RAG integration", "reliability"])}.`,
    suggestedReply: `Hey ${author.replace("u/", "")}, thanks for raising this — ${faker.helpers.arrayElement([
      "happy to walk through benchmarks on a call.",
      "we just shipped an update that addresses this, docs linked below.",
      "would love to learn more about your setup so we can help directly.",
      "this is on our roadmap, tracking it internally now.",
    ])}`,
    statusTimeline: buildTimeline(status, ownerName),
  };
}

/** Ported from lib/mock-data/reddit.ts so MOCK_MODE output matches the dashboard's original static demo data. */
export function createRedditMockClient(): RedditClient {
  async function authenticate(): Promise<void> {
    // no-op in mock mode
  }

  async function fetch(range: { from: Date; to: Date }, keywords: string[]): Promise<RedditRawPayload> {
    faker.seed(FIXTURE_SEEDS.reddit);
    const fromIso = range.from.toISOString().slice(0, 10);
    const toIso = range.to.toISOString().slice(0, 10);

    return Array.from({ length: 42 }, (_, i) => buildMentionRow(i, keywords)).filter(
      (row) => row.createdAt >= fromIso && row.createdAt <= toIso
    );
  }

  return { authenticate, fetch };
}
