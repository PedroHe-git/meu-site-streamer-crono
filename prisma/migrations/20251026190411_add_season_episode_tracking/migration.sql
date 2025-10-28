/*
  Warnings:

  - You are about to drop the column `rating` on the `MediaStatus` table. All the data in the column will be lost.
  - You are about to drop the column `reviewText` on the `MediaStatus` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MediaStatus" DROP COLUMN "rating",
DROP COLUMN "reviewText",
ADD COLUMN     "lastEpisodeWatched" INTEGER,
ADD COLUMN     "lastSeasonWatched" INTEGER;

-- AlterTable
ALTER TABLE "ScheduleItem" ADD COLUMN     "episodeNumber" INTEGER,
ADD COLUMN     "seasonNumber" INTEGER;
