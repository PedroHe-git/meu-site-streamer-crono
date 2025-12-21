-- CreateTable
CREATE TABLE "social_items" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "social_items" ADD CONSTRAINT "social_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
