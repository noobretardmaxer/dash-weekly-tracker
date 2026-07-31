import { apiGet, apiPatch } from "./client";

export type RedditSentiment = "Positive" | "Neutral" | "Negative";
export type RedditMentionType = "Question" | "Complaint" | "Comparison" | "Praise" | "BugReport" | "FeatureRequest";
export type RedditPriority = "Low" | "Medium" | "High" | "Critical";
export type RedditStatus = "New" | "InProgress" | "Responded" | "Resolved" | "Ignored";

// Backend enum values have no spaces (e.g. "InProgress", "BugReport"); these maps supply the
// human-readable, space-containing labels the UI displays while the app keeps the backend's
// values canonical for comparisons, filters, and PATCH payloads.
export const STATUS_LABELS: Record<RedditStatus, string> = {
  New: "New",
  InProgress: "In Progress",
  Responded: "Responded",
  Resolved: "Resolved",
  Ignored: "Ignored",
};

export const MENTION_TYPE_LABELS: Record<RedditMentionType, string> = {
  Question: "Question",
  Complaint: "Complaint",
  Comparison: "Comparison",
  Praise: "Praise",
  BugReport: "Bug Report",
  FeatureRequest: "Feature Request",
};

export type RedditOwner = { id: string; name: string; initials: string };

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
  url: string;
  score: number;
  comments: number;
  sentiment: RedditSentiment;
  mentionType: RedditMentionType;
  priority: RedditPriority;
  status: RedditStatus;
  ownerId: string | null;
  owner: RedditOwner | null;
  fullPost: string;
  topComments: RedditComment[];
  aiSummary: string;
  suggestedReply: string;
  statusTimeline: RedditTimelineEvent[];
  matchedKeyword: string | null;
  mentionedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type RedditMentionsMeta = {
  page: number;
  pageSize: number;
  total: number;
  [key: string]: unknown;
};

export type RedditMentionsResponse = {
  data: RedditMentionRow[];
  meta: RedditMentionsMeta;
};

export type GetRedditMentionsParams = {
  page?: number;
  pageSize?: number;
  sort?: string;
  subreddit?: string;
  status?: RedditStatus;
  priority?: RedditPriority;
  sentiment?: RedditSentiment;
  days?: number;
  from?: string;
  to?: string;
};

export function getRedditMentions(params: GetRedditMentionsParams = {}): Promise<RedditMentionsResponse> {
  return apiGet<RedditMentionsResponse>("/reddit/mentions", params);
}

export function getRedditMention(id: string): Promise<RedditMentionRow> {
  return apiGet<{ data: RedditMentionRow }>(`/reddit/mentions/${id}`).then((res) => res.data);
}

export type UpdateRedditMentionPatch = {
  status?: RedditStatus;
  ownerId?: string | null;
};

export function updateRedditMention(id: string, patch: UpdateRedditMentionPatch): Promise<RedditMentionRow> {
  return apiPatch<{ data: RedditMentionRow }>(`/reddit/mentions/${id}`, patch).then((res) => res.data);
}
