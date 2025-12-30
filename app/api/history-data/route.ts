// app/api/history-data/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userEmail = session.user.email;

  try {
    // 1. Busca o usuário (sem cache, pois é leve e crítico para segurança)
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true, // Precisamos do ID para a tag de cache
        username: true,
        showWatchingList: true,
        showToWatchList: true,
        showWatchedList: true,
        showDroppedList: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Função cacheada para buscar contadores
    // Isso evita bater no banco toda vez que o usuário entra na página
    const getCachedStats = unstable_cache(
      async (userId: string) => {
        return await prisma.mediaStatus.groupBy({
          by: ["status"],
          where: { userId: userId },
          _count: { status: true },
        });
      },
      [`history-stats-${user.id}`], // Chave única do cache
      {
        tags: [`mediastatus-${user.id}`], // Tag para invalidar quando houver updates
        revalidate: 3600 // Revalida a cada 1 hora no máximo
      }
    );

    const statusCounts = await getCachedStats(user.id);

    const listCounts = {
      WATCHING: 0,
      TO_WATCH: 0,
      WATCHED: 0,
      DROPPED: 0,
    };

    statusCounts.forEach((c) => {
      if (c.status in listCounts) {
        listCounts[c.status as keyof typeof listCounts] = c._count.status;
      }
    });

    return NextResponse.json({
      creator: user,
      listCounts,
      isOwner: true,
    });

  } catch (error) {
    console.error("Error fetching history data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}