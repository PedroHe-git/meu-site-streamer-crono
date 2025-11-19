// app/api/feed/following/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  try {
    // Buscar CRIADORES que eu sigo e que têm itens na agenda
    const creators = await prisma.user.findMany({
      where: {
        followers: {
          some: { followerId: session.user.id } // Que eu sigo
        },
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
        // Trazemos apenas o necessário para contar
        scheduleItems: {
            where: {
                scheduledAt: { gte: today, lte: nextWeek },
                isCompleted: false
            },
            select: { id: true }
        }
      }
    });

    // Formatamos para o frontend (adicionando a contagem)
    const formattedCreators = creators.map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        image: user.image,
        twitchUsername: user.twitchUsername,
        itemCount: user.scheduleItems.length // <--- A quantidade mágica
    }));

    return NextResponse.json(formattedCreators);
  } catch (error) {
    console.error(error);
    return new NextResponse("Erro", { status: 500 });
  }
}