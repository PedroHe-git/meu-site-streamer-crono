import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { unstable_cache } from "next/cache";

export async function GET() {
  const getCachedData = unstable_cache(
    async () => {
      const creator = await prisma.user.findFirst({
        where: { role: UserRole.CREATOR },
        select: { 
            id: true, username: true, 
            showToWatchList: true, showWatchingList: true, 
            showWatchedList: true, showDroppedList: true 
        }
      });

      if (!creator) return null;

      const counts = await prisma.mediaStatus.groupBy({
        by: ['status'],
        where: { userId: creator.id },
        _count: { status: true },
      });

      const listCounts = { TO_WATCH: 0, WATCHING: 0, WATCHED: 0, DROPPED: 0 };
      counts.forEach((c) => {
        if (c.status in listCounts) listCounts[c.status as keyof typeof listCounts] = c._count.status;
      });

      return { creator, listCounts };
    },
    ['history-data-api'],
    { revalidate: 3600, tags: ['mediastatus', 'user-profile'] }
  );

  const data = await getCachedData();
  return NextResponse.json(data);
}