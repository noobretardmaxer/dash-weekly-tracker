-- Rename the "ahrefs" enum value to "semrush" in IntegrationName
ALTER TYPE "IntegrationName" ADD VALUE IF NOT EXISTS 'semrush';

-- Update any existing sync_logs rows that reference 'ahrefs'
UPDATE "sync_logs" SET "integration" = 'semrush' WHERE "integration" = 'ahrefs';

-- Postgres does not support DROP VALUE from an enum directly.
-- The old 'ahrefs' value is now unused; it remains in the enum but is
-- harmless since no code path writes it. A full enum recreation would
-- require recreating the column, which is not worth the downtime risk.
