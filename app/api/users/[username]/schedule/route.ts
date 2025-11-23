import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { ProfileVisibility } from "@prisma/client";
import { addWeeks, startOfWeek, endOfWeek, startOfDay, endOfDay, subHours } from "date-fns";

export const runtime = 'nodejs';
export const revalidate = 0; 

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const session = await getServerSession(authOptions);
  const loggedInUserId = session?.user?.id;
  const { username } = params;

  try {
    const user = await prisma.user.findFirst({
      where: { 
        username: {
           equals: decodeURIComponent(username),
           mode: 'insensitive'
        } 
      },
      select: { 
        id: true, 
        profileVisibility: true,
        showWatchingList: true
      },
    });

    if (!user) {
      return new NextResponse(JSON.stringify({ error: "Utilizador não encontrado" }), { status: 404 });
    }

    const isOwner = loggedInUserId === user.id;
    let isFollowing = false;
    if (loggedInUserId && !isOwner) {
      const follow = await prisma.follows.findUnique({
        where: { 
            followerId_followingId: {
                followerId: loggedInUserId, 
                followingId: user.id 
            }
        },
      });
      isFollowing = !!follow;
    }
    
    const canView =
      user.profileVisibility === ProfileVisibility.PUBLIC ||
      isOwner ||
      (user.profileVisibility === ProfileVisibility.FOLLOWERS_ONLY && isFollowing);

    if (!canView) {
      return new NextResponse(JSON.stringify({ error: "Este perfil é privado." }), { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const weekOffset = parseInt(searchParams.get('weekOffset') || '0');

    // --- AJUSTE DE FUSO E SEMANA ---
    // Subtrai 4h para compensar o servidor UTC e manter-se no "dia anterior" se for de noite no Brasil
    const today = subHours(new Date(), 4);
    
    const targetDate = addWeeks(today, weekOffset);
    const startDate = startOfDay(startOfWeek(targetDate, { weekStartsOn: 1 }));
    const endDate = endOfDay(endOfWeek(targetDate, { weekStartsOn: 1 }));

    const scheduleItems = await prisma.scheduleItem.findMany({
      where: {
        userId: user.id,
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
        // REMOVIDO: isCompleted: false
        // Isso permite ver o que já foi assistido na semana
      },
      include: { media: true },
      orderBy: [{ scheduledAt: "asc" }, { horario: "asc" }],
    });

    return NextResponse.json({
      items: scheduleItems,
      weekStart: startDate.toISOString(),
      weekEnd: endDate.toISOString(),
    });

  } catch (error) {
    console.error(`Erro ao buscar cronograma:`, error);
    return new NextResponse(JSON.stringify({ error: "Erro interno" }), { status: 500 });
  }
}