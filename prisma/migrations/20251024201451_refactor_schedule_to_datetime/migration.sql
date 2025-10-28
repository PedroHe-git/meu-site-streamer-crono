/*
  Warnings:

  - You are about to drop the column `dayOfWeek` on the `ScheduleItem` table. All the data in the column will be lost.
  - You are about to drop the column `horario` on the `ScheduleItem` table. All the data in the column will be lost.
  - Added the required column `scheduledAt` to the `ScheduleItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ScheduleItem" DROP COLUMN "dayOfWeek",
DROP COLUMN "horario",
ADD COLUMN     "scheduledAt" TIMESTAMP(3) NOT NULL;
