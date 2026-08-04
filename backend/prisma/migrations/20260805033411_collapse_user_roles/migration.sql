-- Collapse UserRole from {admin, editor, viewer} to {admin, member}.
-- Postgres enums can't drop values in place, so recreate the type.
CREATE TYPE "UserRole_new" AS ENUM ('admin', 'member');

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new"
  USING (CASE "role"::text WHEN 'admin' THEN 'admin' ELSE 'member' END)::"UserRole_new";

DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member';
