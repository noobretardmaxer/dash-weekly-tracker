-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'viewer');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('success', 'failure', 'running');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('success', 'failure', 'partial');

-- CreateEnum
CREATE TYPE "IntegrationName" AS ENUM ('posthog', 'gsc', 'ahrefs', 'twitter', 'discord', 'reddit');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('traffic_drop', 'keyword_drop', 'backlinks_lost', 'activation_drop', 'signups_drop', 'mention_spike');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('info', 'warning', 'critical');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('open', 'acknowledged', 'resolved');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('Ready', 'Generating', 'Failed');

-- CreateEnum
CREATE TYPE "RedditSentiment" AS ENUM ('Positive', 'Neutral', 'Negative');

-- CreateEnum
CREATE TYPE "RedditMentionType" AS ENUM ('Question', 'Complaint', 'Comparison', 'Praise', 'BugReport', 'FeatureRequest');

-- CreateEnum
CREATE TYPE "RedditPriority" AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- CreateEnum
CREATE TYPE "RedditStatus" AS ENUM ('New', 'InProgress', 'Responded', 'Resolved', 'Ignored');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'viewer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cronExpr" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "lastDurationMs" INTEGER,
    "lastStatus" "JobStatus",
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "integration" "IntegrationName" NOT NULL,
    "requestId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "status" "SyncStatus" NOT NULL,
    "recordsProcessed" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metricSource" TEXT NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "previousValue" DOUBLE PRECISION NOT NULL,
    "deltaPct" DOUBLE PRECISION NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'open',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'Generating',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "website_metrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "visitors" INTEGER NOT NULL,
    "uniqueVisitors" INTEGER NOT NULL,
    "returningVisitors" INTEGER NOT NULL,
    "signups" INTEGER NOT NULL,
    "activationRate" DOUBLE PRECISION NOT NULL,
    "avgSessionDurationSec" INTEGER NOT NULL,
    "bounceRate" DOUBLE PRECISION NOT NULL,
    "trafficSources" JSONB NOT NULL,
    "deviceBreakdown" JSONB NOT NULL,
    "countryBreakdown" JSONB NOT NULL,
    "topLandingPages" JSONB NOT NULL,
    "topExitPages" JSONB NOT NULL,
    "activationFunnel" JSONB NOT NULL,
    "conversionFunnel" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'mock',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "website_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_console_metrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "clicks" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL,
    "ctr" DOUBLE PRECISION NOT NULL,
    "avgPosition" DOUBLE PRECISION NOT NULL,
    "topQueries" JSONB NOT NULL,
    "topPages" JSONB NOT NULL,
    "countries" JSONB NOT NULL,
    "devices" JSONB NOT NULL,
    "searchAppearance" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'mock',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_console_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_metrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "organicTraffic" INTEGER NOT NULL,
    "organicKeywords" INTEGER NOT NULL,
    "domainRating" DOUBLE PRECISION NOT NULL,
    "backlinks" INTEGER NOT NULL,
    "referringDomains" INTEGER NOT NULL,
    "newBacklinks" INTEGER NOT NULL,
    "lostBacklinks" INTEGER NOT NULL,
    "topPages" JSONB NOT NULL,
    "fastestGrowingKeywords" JSONB NOT NULL,
    "losingKeywords" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'mock',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twitter_metrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "followers" INTEGER NOT NULL,
    "newFollowers" INTEGER NOT NULL,
    "mentions" INTEGER NOT NULL,
    "profileVisits" INTEGER NOT NULL,
    "engagementRate" DOUBLE PRECISION NOT NULL,
    "linkClicks" INTEGER NOT NULL,
    "topTweets" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'mock',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "twitter_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discord_metrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "memberCount" INTEGER NOT NULL,
    "dau" INTEGER NOT NULL,
    "wau" INTEGER NOT NULL,
    "messages" INTEGER NOT NULL,
    "topChannels" JSONB NOT NULL,
    "mostActiveMembers" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'mock',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discord_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reddit_mentions" (
    "id" TEXT NOT NULL,
    "subreddit" TEXT NOT NULL,
    "postTitle" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comments" INTEGER NOT NULL,
    "sentiment" "RedditSentiment" NOT NULL,
    "mentionType" "RedditMentionType" NOT NULL,
    "priority" "RedditPriority" NOT NULL,
    "status" "RedditStatus" NOT NULL DEFAULT 'New',
    "ownerId" TEXT,
    "fullPost" TEXT NOT NULL,
    "topComments" JSONB NOT NULL,
    "aiSummary" TEXT NOT NULL,
    "suggestedReply" TEXT NOT NULL,
    "statusTimeline" JSONB NOT NULL,
    "matchedKeyword" TEXT NOT NULL,
    "mentionedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reddit_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_metrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "blogsPublished" INTEGER NOT NULL,
    "blogVisitors" INTEGER NOT NULL,
    "avgReadingTimeSec" INTEGER NOT NULL,
    "contentConversions" INTEGER NOT NULL,
    "topCategories" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'mock',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "visitors" INTEGER NOT NULL,
    "timeOnPageSec" INTEGER NOT NULL,
    "ctr" DOUBLE PRECISION NOT NULL,
    "conversions" INTEGER NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keyword_rankings" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "currentPosition" INTEGER NOT NULL,
    "previousPosition" INTEGER NOT NULL,
    "movement" INTEGER NOT NULL,
    "searchVolume" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "ctr" DOUBLE PRECISION NOT NULL,
    "landingPage" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "keyword_rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitor_metrics" (
    "id" TEXT NOT NULL,
    "competitorDomain" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "organicTraffic" INTEGER NOT NULL,
    "organicKeywords" INTEGER NOT NULL,
    "domainRating" DOUBLE PRECISION NOT NULL,
    "backlinks" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitor_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_name_key" ON "jobs"("name");

-- CreateIndex
CREATE INDEX "sync_logs_integration_startedAt_idx" ON "sync_logs"("integration", "startedAt");

-- CreateIndex
CREATE INDEX "alerts_status_createdAt_idx" ON "alerts"("status", "createdAt");

-- CreateIndex
CREATE INDEX "alerts_type_idx" ON "alerts"("type");

-- CreateIndex
CREATE INDEX "reports_createdAt_idx" ON "reports"("createdAt");

-- CreateIndex
CREATE INDEX "reports_type_idx" ON "reports"("type");

-- CreateIndex
CREATE INDEX "website_metrics_date_idx" ON "website_metrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "website_metrics_date_key" ON "website_metrics"("date");

-- CreateIndex
CREATE INDEX "search_console_metrics_date_idx" ON "search_console_metrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "search_console_metrics_date_key" ON "search_console_metrics"("date");

-- CreateIndex
CREATE INDEX "seo_metrics_date_idx" ON "seo_metrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "seo_metrics_date_key" ON "seo_metrics"("date");

-- CreateIndex
CREATE INDEX "twitter_metrics_date_idx" ON "twitter_metrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "twitter_metrics_date_key" ON "twitter_metrics"("date");

-- CreateIndex
CREATE INDEX "discord_metrics_date_idx" ON "discord_metrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "discord_metrics_date_key" ON "discord_metrics"("date");

-- CreateIndex
CREATE INDEX "reddit_mentions_subreddit_mentionedAt_idx" ON "reddit_mentions"("subreddit", "mentionedAt");

-- CreateIndex
CREATE INDEX "reddit_mentions_status_idx" ON "reddit_mentions"("status");

-- CreateIndex
CREATE INDEX "reddit_mentions_priority_idx" ON "reddit_mentions"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "reddit_mentions_url_key" ON "reddit_mentions"("url");

-- CreateIndex
CREATE INDEX "blog_metrics_date_idx" ON "blog_metrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "blog_metrics_date_key" ON "blog_metrics"("date");

-- CreateIndex
CREATE INDEX "blog_posts_capturedAt_idx" ON "blog_posts"("capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_capturedAt_key" ON "blog_posts"("slug", "capturedAt");

-- CreateIndex
CREATE INDEX "keyword_rankings_currentPosition_idx" ON "keyword_rankings"("currentPosition");

-- CreateIndex
CREATE UNIQUE INDEX "keyword_rankings_keyword_checkedAt_key" ON "keyword_rankings"("keyword", "checkedAt");

-- CreateIndex
CREATE UNIQUE INDEX "competitor_metrics_competitorDomain_date_key" ON "competitor_metrics"("competitorDomain", "date");

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reddit_mentions" ADD CONSTRAINT "reddit_mentions_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
