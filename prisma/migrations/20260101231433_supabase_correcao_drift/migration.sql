/*
  Warnings:

  - The values [FOLLOWERS_ONLY] on the enum `ProfileVisibility` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `follows` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProfileVisibility_new" AS ENUM ('PUBLIC', 'PRIVATE');
ALTER TABLE "users" ALTER COLUMN "profileVisibility" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "profileVisibility" TYPE "ProfileVisibility_new" USING ("profileVisibility"::text::"ProfileVisibility_new");
ALTER TYPE "ProfileVisibility" RENAME TO "ProfileVisibility_old";
ALTER TYPE "ProfileVisibility_new" RENAME TO "ProfileVisibility";
DROP TYPE "ProfileVisibility_old";
ALTER TABLE "users" ALTER COLUMN "profileVisibility" SET DEFAULT 'PUBLIC';
COMMIT;

-- DropForeignKey
ALTER TABLE "follows" DROP CONSTRAINT "follows_followerId_fkey";

-- DropForeignKey
ALTER TABLE "follows" DROP CONSTRAINT "follows_followingId_fkey";

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "totalSeasons" INTEGER;

-- AlterTable
ALTER TABLE "MediaStatus" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "seasonProgress" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "amazonWishlistUrl" TEXT,
ADD COLUMN     "statFollowers" TEXT,
ADD COLUMN     "statMedia" TEXT,
ADD COLUMN     "statRegion" TEXT,
ADD COLUMN     "youtubeFourthUrl" TEXT,
ADD COLUMN     "youtubeMainUrl" TEXT,
ADD COLUMN     "youtubeSecondUrl" TEXT,
ADD COLUMN     "youtubeThirdUrl" TEXT;

-- DropTable
DROP TABLE "follows";

-- CreateTable
CREATE TABLE "sponsors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sponsors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Media_title_idx" ON "Media"("title");

-- CreateIndex
CREATE INDEX "MediaStatus_userId_status_idx" ON "MediaStatus"("userId", "status");

-- CreateIndex
CREATE INDEX "MediaStatus_userId_updatedAt_idx" ON "MediaStatus"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "ScheduleItem_userId_scheduledAt_idx" ON "ScheduleItem"("userId", "scheduledAt");

-- CreateIndex
CREATE INDEX "ScheduleItem_userId_isCompleted_idx" ON "ScheduleItem"("userId", "isCompleted");

-- AddForeignKey
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
