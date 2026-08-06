-- AlterEnum
-- Adds the blog + social integrations so their sync_logs rows can be written
-- (SyncLog.integration is typed IntegrationName). Multiple ADD VALUEs in one
-- migration require PostgreSQL 12+ (Neon is fine); the values are not used in
-- this same migration, so this is safe.
ALTER TYPE "IntegrationName" ADD VALUE 'blog';
ALTER TYPE "IntegrationName" ADD VALUE 'social';

-- AlterEnum
-- Adds the sync_failure alert type raised when an integration sync fails.
ALTER TYPE "AlertType" ADD VALUE 'sync_failure';
