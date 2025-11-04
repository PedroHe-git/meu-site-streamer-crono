// app/api/users/[username]/simple-schedule/route.ts
// (NOVO ARQUIVO)

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { ProfileVisibility } from "@prisma/client";
// --- [MUDANÇA] Importar 'isSameDay' ---
import { addDays, startOfWeek, endOfWeek, startOfDay, endOfDay, isSameDay } from "date-fns";

export const runtime = 'nodejs';
export const revalidate = 0; 

// Tipo para o formato de resposta desejado
type SimpleScheduleEvent = {
  day: string;
  event: string;
  active: boolean;
};

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const loggedInUserId = session?.user?.id;
  const { username } = params;

  try {
    // 1. Encontrar o utilizador do perfil (lógica idêntica à sua API existente)
    const user = await prisma.user.findUnique({
      where: { username: decodeURIComponent(username).toLowerCase() },
      select: { 
        id: true, 
        profileVisibility: true,
        showWatchingList: true
      },
    });

    if (!user) {
      return new NextResponse(JSON.stringify({ error: "Utilizador não encontrado" }), {
        status: 404,
      });
    }

    // 2. Verificar Privacidade (lógica idêntica à sua API existente)
    const isOwner = loggedInUserId === user.id;
    let isFollowing = false;
    if (loggedInUserId && !isOwner) {
      const follow = await prisma.follows.findFirst({
        where: { followerId: loggedInUserId, followingId: user.id },
      });
      isFollowing = !!follow;
    }
    const canView =
      user.profileVisibility === ProfileVisibility.PUBLIC ||
      isOwner ||
      (user.profileVisibility === ProfileVisibility.FOLLOWERS_ONLY && isFollowing);

    if (!canView || (!user.showWatchingList && !isOwner)) {
      // Se não pode ver, retorna um array de 7 dias como "Folga"
      const folgaSchedule: SimpleScheduleEvent[] = [
        { day: "Seg", event: "Privado", active: false },
        { day: "Ter", event: "Privado", active: false },
        { day: "Qua", event: "Privado", active: false },
        { day: "Qui", event: "Privado", active: false },
        { day: "Sex", event: "Privado", active: false },
        { day: "Sáb", event: "Privado", active: false },
        { day: "Dom", event: "Privado", active: false },
      ];
      return NextResponse.json(folgaSchedule);
    }

    // 3. Obter o weekOffset da URL (lógica idêntica)
    const { searchParams } = new URL(request.url);
    const weekOffset = parseInt(searchParams.get('weekOffset') || '0');

    // 4. Calcular o intervalo de datas (Início na Segunda) (lógica idêntica)
    const today = new Date();
    const weekOptions = { weekStartsOn: 1 as const }; 
    
    const targetDate = addDays(today, weekOffset * 7);
    const startDate = startOfDay(startOfWeek(targetDate, weekOptions)); // Esta é a Segunda-feira
    const endDate = endOfDay(endOfWeek(targetDate, weekOptions));     // Este é o Domingo

    // 5. Buscar todos os itens DENTRO desse intervalo (lógica idêntica)
    const scheduleItems = await prisma.scheduleItem.findMany({
      where: {
        userId: user.id,
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
        isCompleted: false, // <-- [RECOMENDAÇÃO] Apenas mostrar itens não concluídos
      },
      include: {
        media: true, // Precisamos da mídia para o título do evento
      },
      orderBy: [
        { scheduledAt: "asc" },
        { horario: "asc" },
      ],
    });

    // --- [INÍCIO DA NOVA LÓGICA DE FORMATAÇÃO] ---

    // 6. Mapear os dias da semana para as abreviações
    const dayAbbreviations = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const formattedSchedule: SimpleScheduleEvent[] = [];

    // 7. Iterar pelos 7 dias da semana (Segunda a Domingo)
    for (let i = 0; i < 7; i++) {
      const currentDay = addDays(startDate, i);
      
      // Encontra o *primeiro* item agendado para este dia
      const eventForItem = scheduleItems.find(item => 
        isSameDay(new Date(item.scheduledAt), currentDay)
      );

      if (eventForItem) {
        // Se encontrar um evento, usa o título da mídia
        formattedSchedule.push({
          day: dayAbbreviations[i],
          event: eventForItem.media.title, 
          active: true
        });
      } else {
        // Se não encontrar evento, marca como "Folga"
        formattedSchedule.push({
          day: dayAbbreviations[i],
          event: "Folga",
          active: false
        });
      }
    }

    // 8. Retorna o JSON formatado
    return NextResponse.json(formattedSchedule);
    
    // --- [FIM DA NOVA LÓGICA DE FORMATAÇÃO] ---

  } catch (error) {
    console.error(`Erro ao buscar cronograma simples para ${username}:`, error);
    return new NextResponse(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500 }
    );
  }
}