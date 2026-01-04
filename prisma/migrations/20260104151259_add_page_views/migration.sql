-- CreateTable
CREATE TABLE "page_views" (
    "path" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("path")
);
