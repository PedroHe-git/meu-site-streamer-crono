/*
  Warnings:

  - You are about to drop the `AnalyticsEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "AnalyticsEvent";

-- CreateTable
CREATE TABLE "analytics" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "details" TEXT,
    "path" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_event_details_idx" ON "analytics"("event", "details");

-- CreateIndex
CREATE INDEX "analytics_createdAt_idx" ON "analytics"("createdAt");
