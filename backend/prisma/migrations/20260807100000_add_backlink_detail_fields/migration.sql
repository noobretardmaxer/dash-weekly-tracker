-- AlterTable
ALTER TABLE "seo_metrics" ADD COLUMN "refDomainsByAuthority" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "seo_metrics" ADD COLUMN "topRefDomains" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "seo_metrics" ADD COLUMN "topAnchors" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "seo_metrics" ADD COLUMN "topTlds" JSONB NOT NULL DEFAULT '[]';
