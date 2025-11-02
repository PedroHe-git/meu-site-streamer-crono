/*
  Warnings:

  - A unique constraint covering the columns `[twitchUsername]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "twitchUsername" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_twitchUsername_key" ON "users"("twitchUsername");
