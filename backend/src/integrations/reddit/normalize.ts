import type {
  RedditMentionRecord,
  RedditMentionType,
  RedditPriority,
  RedditRawPayload,
  RedditRawPost,
  RedditSentiment,
} from "./types";

const POSITIVE_WORDS = ["love", "great", "awesome", "amazing", "impressed", "saved us", "clicked", "finally"];
const NEGATIVE_WORDS = ["crash", "bug", "broken", "slow", "expensive", "steep", "issue", "problem", "fails"];

function inferSentiment(text: string): RedditSentiment {
  const lower = text.toLowerCase();
  const positiveHits = POSITIVE_WORDS.filter((w) => lower.includes(w)).length;
  const negativeHits = NEGATIVE_WORDS.filter((w) => lower.includes(w)).length;
  if (positiveHits > negativeHits) return "Positive";
  if (negativeHits > positiveHits) return "Negative";
  return "Neutral";
}

function inferMentionType(text: string): RedditMentionType {
  const lower = text.toLowerCase();
  if (lower.includes("bug") || lower.includes("crash") || lower.includes("broken")) return "BugReport";
  if (lower.includes("feature request") || lower.includes("would be great if")) return "FeatureRequest";
  if (lower.includes(" vs ") || lower.includes("alternative") || lower.includes("compare")) return "Comparison";
  if (lower.trim().endsWith("?")) return "Question";
  if (POSITIVE_WORDS.some((w) => lower.includes(w))) return "Praise";
  return "Complaint";
}

function inferPriority(post: RedditRawPost, sentiment: RedditSentiment): RedditPriority {
  const engagement = post.score + post.comments * 2;
  if (sentiment === "Negative" && engagement > 200) return "Critical";
  if (sentiment === "Negative" && engagement > 50) return "High";
  if (engagement > 300) return "Medium";
  return "Low";
}

function buildAiSummary(post: RedditRawPost, sentiment: RedditSentiment, mentionType: RedditMentionType): string {
  return `This ${mentionType.replace(/([A-Z])/g, " $1").trim().toLowerCase()} in ${post.subreddit} carries ${sentiment.toLowerCase()} sentiment and has ${post.comments} replies. Matched watch keyword "${post.matchedKeyword}".`;
}

function buildSuggestedReply(post: RedditRawPost): string {
  return `Hey ${post.author.replace("u/", "")}, thanks for the mention — our team is reviewing this thread and will follow up here.`;
}

export async function normalize(raw: RedditRawPayload): Promise<RedditMentionRecord[]> {
  return raw.map((post) => {
    const sentiment = post.sentiment ?? inferSentiment(`${post.postTitle} ${post.fullPost}`);
    const mentionType = post.mentionType ?? inferMentionType(`${post.postTitle} ${post.fullPost}`);
    const priority = post.priority ?? inferPriority(post, sentiment);
    const status = post.status ?? "New";

    return {
      subreddit: post.subreddit,
      postTitle: post.postTitle,
      author: post.author,
      url: post.url,
      score: post.score,
      comments: post.comments,
      sentiment,
      mentionType,
      priority,
      status,
      ownerName: post.ownerName ?? null,
      fullPost: post.fullPost,
      topComments: post.topComments,
      aiSummary: post.aiSummary ?? buildAiSummary(post, sentiment, mentionType),
      suggestedReply: post.suggestedReply ?? buildSuggestedReply(post),
      statusTimeline: post.statusTimeline ?? [{ status, actor: "System", date: post.createdAt }],
      matchedKeyword: post.matchedKeyword,
      mentionedAt: new Date(post.createdAt),
    };
  });
}
