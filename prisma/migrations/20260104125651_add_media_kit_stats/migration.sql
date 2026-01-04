-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastStatsUpdate" TIMESTAMP(3),
ADD COLUMN     "twitchFollowersCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "twitchTotalViews" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "youtubeSubsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "youtubeVideoCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "youtubeViewsCount" BIGINT NOT NULL DEFAULT 0;
