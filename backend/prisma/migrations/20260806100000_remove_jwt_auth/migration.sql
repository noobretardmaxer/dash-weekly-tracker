-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_userId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_invitedById_fkey";

-- DropTable
DROP TABLE "refresh_tokens";

-- DropIndex
DROP INDEX "users_inviteTokenHash_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "inviteExpiresAt",
DROP COLUMN "inviteTokenHash",
DROP COLUMN "invitedById",
DROP COLUMN "passwordHash",
DROP COLUMN "status";

-- DropEnum
DROP TYPE "UserStatus";
