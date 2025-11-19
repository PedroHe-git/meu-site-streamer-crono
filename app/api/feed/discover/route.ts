// app/api/feed/discover/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  try {
    const creators = await prisma.user.findMany({
      where: {
        role: 'CREATOR',
        // Excluir a mim mesmo
        NOT: { id: userId }, 
        // Excluir quem eu já sigo (se eu estiver logado)
        ...(userId && {
            followers: {
                none: { followerId: userId } 
            }
        }),
        // Apenas quem tem itens agendados nesta semana
        scheduleItems: {
          some: {
            scheduledAt: { gte: today, lte: nextWeek },
            isCompleted: false
          }
        }
      },
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
        twitchUsername: true,
        // Contagem de itens para mostrar no card
        scheduleItems: {
            where: {
                scheduledAt: { gte: today, lte: nextWeek },
                isCompleted: false
            },
            select: { id: true }
        }
      },
      take: 6 // Limite de sugestões
    });

    // Formatação igual à rota 'following'
    const formattedCreators = creators.map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        image: user.image,
        twitchUsername: user.twitchUsername,
        itemCount: user.scheduleItems.length
    }));

    return NextResponse.json(formattedCreators);
  } catch (error) {
    console.error(error);
    return new NextResponse("Erro", { status: 500 });
  }
}