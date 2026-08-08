-- Rename the "ahrefs" enum value to "semrush" in IntegrationName.
-- PostgreSQL forbids using a newly-added enum value in the same transaction,
-- so we recreate the type entirely instead of ADD VALUE + UPDATE.

CREATE TYPE "IntegrationName_new" AS ENUM ('posthog', 'gsc', 'semrush', 'twitter', 'discord', 'reddit', 'blog', 'social');

ALTER TABLE "sync_logs"
  ALTER COLUMN "integration" TYPE "IntegrationName_new"
  USING (
    CASE WHEN "integration"::text = 'ahrefs' THEN 'semrush'::"IntegrationName_new"
         ELSE "integration"::text::"IntegrationName_new"
    END
  );

DROP TYPE "IntegrationName";
ALTER TYPE "IntegrationName_new" RENAME TO "IntegrationName";
