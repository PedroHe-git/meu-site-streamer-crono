-- AlterEnum
ALTER TYPE "MediaType" ADD VALUE 'SERIES';

-- DropIndex
DROP INDEX "Media_malId_key";

-- DropIndex
DROP INDEX "Media_tmdbId_key";
