import { faker } from "@faker-js/faker";
import { SEEDS } from "./seed";
import { generateTimeSeries } from "./utils";
import { TEAM_MEMBERS } from "@/lib/constants/team-members";

faker.seed(SEEDS.reddit);

/** Broad social-listening count of organic HydraDB mentions across Reddit, distinct from the curated, triaged rows below. */
export const mentionsSeries = generateTimeSeries({
  baseValue: 3.4,
  volatility: 0.6,
  trendPct: 25,
  minValue: 0,
});

export const SUBREDDITS = [
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

export type RedditSentiment = "Positive" | "Neutral" | "Negative";
export type RedditMentionType =
  | "Question"
  | "Complaint"
  | "Comparison"
  | "Praise"
  | "Bug Report"
  | "Feature Request";
export type RedditPriority = "Low" | "Medium" | "High" | "Critical";
export type RedditStatus = "New" | "In Progress" | "Responded" | "Resolved" | "Ignored";

export type RedditComment = {
  author: string;
  text: string;
  score: number;
};

export type RedditTimelineEvent = {
  status: RedditStatus;
  actor: string;
  date: string;
};

export type RedditMentionRow = {
  id: string;
  subreddit: string;
  postTitle: string;
  author: string;
  score: number;
  comments: number;
  sentiment: RedditSentiment;
  mentionType: RedditMentionType;
  priority: RedditPriority;
  owner: string;
  status: RedditStatus;
  url: string;
  createdAt: string;
  fullPost: string;
  topComments: RedditComment[];
  aiSummary: string;
  suggestedReply: string;
  statusTimeline: RedditTimelineEvent[];
};

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
const MENTION_TYPES: RedditMentionType[] = [
  "Question",
  "Complaint",
  "Comparison",
  "Praise",
  "Bug Report",
  "Feature Request",
];
const PRIORITIES: RedditPriority[] = ["Low", "Medium", "High", "Critical"];
const STATUSES: RedditStatus[] = ["New", "In Progress", "Responded", "Resolved", "Ignored"];

function buildTimeline(finalStatus: RedditStatus, owner: string): RedditTimelineEvent[] {
  const order: RedditStatus[] = ["New", "In Progress", "Responded", "Resolved"];
  const finalIndex = finalStatus === "Ignored" ? 0 : order.indexOf(finalStatus);
  const steps = finalStatus === "Ignored" ? [order[0]] : order.slice(0, finalIndex + 1);
  let daysAgo = steps.length * 2 + faker.number.int({ min: 1, max: 3 });
  return steps.map((status, i) => {
    daysAgo -= i === 0 ? 0 : faker.number.int({ min: 1, max: 3 });
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return {
      status,
      actor: i === 0 ? "System" : owner,
      date: date.toISOString().slice(0, 10),
    };
  });
}

function buildMentionRow(index: number): RedditMentionRow {
  const subreddit = faker.helpers.arrayElement(SUBREDDITS);
  const postTitle = faker.helpers.arrayElement(POST_TITLE_TEMPLATES)();
  const author = `u/${faker.internet.username().toLowerCase()}`;
  const sentiment = faker.helpers.arrayElement(SENTIMENTS);
  const mentionType = faker.helpers.arrayElement(MENTION_TYPES);
  const priority = faker.helpers.arrayElement(PRIORITIES);
  const status = faker.helpers.arrayElement(STATUSES);
  const owner = faker.helpers.arrayElement(TEAM_MEMBERS).name;
  const createdAt = faker.date.recent({ days: 21 }).toISOString().slice(0, 10);

  return {
    id: `reddit-${index}`,
    subreddit,
    postTitle,
    author,
    score: faker.number.int({ min: 1, max: 640 }),
    comments: faker.number.int({ min: 0, max: 180 }),
    sentiment,
    mentionType,
    priority,
    owner,
    status,
    url: `https://reddit.com/${subreddit}/comments/${faker.string.alphanumeric(6)}`,
    createdAt,
    fullPost: faker.lorem.paragraphs({ min: 2, max: 4 }, "\n\n"),
    topComments: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => ({
      author: `u/${faker.internet.username().toLowerCase()}`,
      text: faker.lorem.sentences({ min: 1, max: 3 }),
      score: faker.number.int({ min: -4, max: 220 }),
    })).sort((a, b) => b.score - a.score),
    aiSummary: `This ${mentionType.toLowerCase()} in ${subreddit} carries ${sentiment.toLowerCase()} sentiment. The author is asking about ${faker.helpers.arrayElement(["pricing", "performance at scale", "migration effort", "RAG integration", "reliability"])}, and the thread has ${faker.number.int({ min: 0, max: 180 })} replies discussing alternatives.`,
    suggestedReply: `Hey ${author.replace("u/", "")}, thanks for raising this — ${faker.helpers.arrayElement([
      "happy to walk through benchmarks on a call.",
      "we just shipped an update that addresses this, docs linked below.",
      "would love to learn more about your setup so we can help directly.",
      "this is on our roadmap, tracking it internally now.",
    ])}`,
    statusTimeline: buildTimeline(status, owner),
  };
}

export const redditMentions: RedditMentionRow[] = Array.from({ length: 42 }, (_, i) => buildMentionRow(i));
