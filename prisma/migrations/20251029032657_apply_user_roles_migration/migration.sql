-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CREATOR', 'VISITOR');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'VISITOR';
