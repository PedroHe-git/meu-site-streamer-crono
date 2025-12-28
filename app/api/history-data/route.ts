import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions"; // Ajuste o caminho conforme seu projeto
import prisma from "@/lib/prisma"; // Ajuste o caminho conforme seu projeto

export const dynamic = 'force-dynamic'; // Garante que a rota não seja cacheada estaticamente

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Busca o usuário logado (que é o dono do histórico nesta página)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
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

    // 2. Busca os contadores de status
    const statusCounts = await prisma.mediaStatus.groupBy({
      by: ["status"],
      where: { user: { email: session.user.email } },
      _count: { status: true },
    });

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
      isOwner: true, // Na página /historico, assume-se que é o próprio usuário vendo seu histórico
    });
  } catch (error) {
    console.error("Error fetching history data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}