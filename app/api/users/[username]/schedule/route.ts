// app/api/users/[username]/schedule/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { ProfileVisibility } from "@prisma/client";
// [MUDANÇA 1: Importar 'format']
import { addDays, startOfWeek, endOfWeek, startOfDay, endOfDay, format } from "date-fns";
// [REMOVIDO] ptBR não é mais necessário aqui

export const runtime = 'nodejs';
// Força esta rota a ser dinâmica (sem cache de servidor)
export const revalidate = 0; 


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

    // 2. Verificar Privacidade
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

    // 3. Obter o weekOffset da URL (ex: ?weekOffset=0)
    const { searchParams } = new URL(request.url);
    const weekOffset = parseInt(searchParams.get('weekOffset') || '0');

    // 4. Calcular o intervalo de datas
    const today = new Date();
    // [MUDANÇA 2: Remover o 'locale' do cálculo para evitar bugs]
    const weekOptions = { weekStartsOn: 0 as const }; 
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

    // 6. Retorna os itens e as datas da semana
    return NextResponse.json({
      items: scheduleItems,
      // [MUDANÇA 3: Formatar a data para 'yyyy-MM-dd']
      weekStart: format(startDate, 'yyyy-MM-dd'),
      weekEnd: format(endDate, 'yyyy-MM-dd'),
    });

  } catch (error) {
    console.error(`Erro ao buscar cronograma para ${username}:`, error);
    return new NextResponse(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500 }
    );
  }
}