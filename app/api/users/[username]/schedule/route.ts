// app/api/users/[username]/schedule/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { ProfileVisibility } from "@prisma/client";
import { addDays, startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const session = await getServerSession(authOptions);
  const { username } = params;

  try {
    // 1. Encontrar o utilizador do perfil
    const user = await prisma.user.findUnique({
      where: { username: decodeURIComponent(username) },
      select: { id: true, profileVisibility: true },
    });

    if (!user) {
      return new NextResponse(JSON.stringify({ error: "Utilizador não encontrado" }), {
        status: 404,
      });
    }

    // 2. Verificar Privacidade (igual a antes)
    const isOwner = session?.user?.id === user.id;
    let isFollowing = false;
    if (session?.user?.id && !isOwner) {
      const follow = await prisma.follows.findFirst({
        where: { followerId: session.user.id, followingId: user.id },
      });
      isFollowing = !!follow;
    }
    const canView =
      user.profileVisibility === ProfileVisibility.PUBLIC ||
      isOwner ||
      (user.profileVisibility === ProfileVisibility.FOLLOWERS_ONLY && isFollowing);

    if (!canView) {
      return new NextResponse(
        JSON.stringify({ error: "Este perfil é privado." }),
        { status: 403 }
      );
    }

    // --- [ INÍCIO DA MODIFICAÇÃO DA LÓGICA ] ---

    // 3. Obter o weekOffset da URL (ex: ?weekOffset=0)
    const { searchParams } = new URL(request.url);
    // O '|| 0' garante que o padrão é a semana atual
    const weekOffset = parseInt(searchParams.get('weekOffset') || '0');

    // 4. Calcular o intervalo de datas para essa semana
    const today = new Date();
    // O 'weekStartsOn: 0' define Domingo como o início da semana
    const weekOptions = {weekStartsOn: 0 as const }; 
    const targetDate = addDays(today, weekOffset * 7);
    const startDate = startOfDay(startOfWeek(targetDate, weekOptions));
    const endDate = endOfDay(endOfWeek(targetDate, weekOptions));

    // 5. Buscar todos os itens (concluídos ou não) DENTRO desse intervalo
    const scheduleItems = await prisma.scheduleItem.findMany({
      where: {
        userId: user.id,
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        media: true, // Inclui os detalhes da mídia
      },
      orderBy: [
        { scheduledAt: "asc" },
        { horario: "asc" },
      ],
    });
    // --- [ FIM DA MODIFICAÇÃO DA LÓGICA ] ---

    // 6. Retorna os itens e as datas da semana para o frontend
    return NextResponse.json({
      items: scheduleItems,
      weekStart: startDate.toISOString(),
      weekEnd: endDate.toISOString(),
    });

  } catch (error) {
    console.error(`Erro ao buscar cronograma para ${username}:`, error);
    return new NextResponse(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500 }
    );
  }
}