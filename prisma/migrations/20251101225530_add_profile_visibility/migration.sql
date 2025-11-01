/*
  Warnings:

  - You are about to drop the column `isProfilePrivate` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'FOLLOWERS_ONLY');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "isProfilePrivate",
ADD COLUMN     "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC';
