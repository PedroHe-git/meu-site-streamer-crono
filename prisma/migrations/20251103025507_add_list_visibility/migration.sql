-- AlterTable
ALTER TABLE "users" ADD COLUMN     "showDroppedList" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showToWatchList" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showWatchedList" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showWatchingList" BOOLEAN NOT NULL DEFAULT true;
