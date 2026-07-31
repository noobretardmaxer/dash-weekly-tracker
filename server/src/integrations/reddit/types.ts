export type RedditSentiment = "Positive" | "Neutral" | "Negative";
export type RedditMentionType = "Question" | "Complaint" | "Comparison" | "Praise" | "BugReport" | "FeatureRequest";
export type RedditPriority = "Low" | "Medium" | "High" | "Critical";
export type RedditStatusValue = "New" | "InProgress" | "Responded" | "Resolved" | "Ignored";

export type RedditCommentRaw = { author: string; text: string; score: number };
export type RedditTimelineEventRaw = { status: RedditStatusValue; actor: string; date: string };

/**
 * A single fetched Reddit post/mention. Real client.ts returns bare posts
 * (sentiment/priority/etc. undefined -- computed by normalize()'s heuristic).
 * mock-client.ts returns fully pre-triaged rows (matching the historical demo
 * data the frontend used to render directly) so normalize() just passes those
 * fields through unchanged when present.
 */
export type RedditRawPost = {
  subreddit: string;
  postTitle: string;
  author: string;
  url: string;
  score: number;
  comments: number;
  createdAt: string; // ISO date
  fullPost: string;
  topComments: RedditCommentRaw[];
  matchedKeyword: string;

  sentiment?: RedditSentiment;
  mentionType?: RedditMentionType;
  priority?: RedditPriority;
  status?: RedditStatusValue;
  ownerName?: string;
  aiSummary?: string;
  suggestedReply?: string;
  statusTimeline?: RedditTimelineEventRaw[];
};

export type RedditRawPayload = RedditRawPost[];

export type RedditMentionRecord = {
  subreddit: string;
  postTitle: string;
  author: string;
  url: string;
  score: number;
  comments: number;
  sentiment: RedditSentiment;
  mentionType: RedditMentionType;
  priority: RedditPriority;
  status: RedditStatusValue;
  ownerName: string | null;
  fullPost: string;
  topComments: RedditCommentRaw[];
  aiSummary: string;
  suggestedReply: string;
  statusTimeline: RedditTimelineEventRaw[];
  matchedKeyword: string;
  mentionedAt: Date;
};

export interface RedditClient {
  authenticate(): Promise<void>;
  fetch(range: { from: Date; to: Date }, keywords: string[]): Promise<RedditRawPayload>;
}
