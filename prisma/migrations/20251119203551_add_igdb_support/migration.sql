/*
  Warnings:

  - A unique constraint covering the columns `[mediaType,igdbId]` on the table `Media` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "MediaType" ADD VALUE 'GAME';

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "igdbId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Media_mediaType_igdbId_key" ON "Media"("mediaType", "igdbId");
