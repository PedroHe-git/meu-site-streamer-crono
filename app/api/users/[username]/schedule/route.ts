// app/api/users/[username]/schedule/route.ts (Atualizado e Otimizado)

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { ProfileVisibility } from "@prisma/client";
import { addWeeks, startOfWeek, endOfWeek, startOfDay, endOfDay, format } from "date-fns";

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
    // 1. Encontrar o utilizador do perfil
    const user = await prisma.user.findFirst({ // Usei findFirst com mode: insensitive para garantir match
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
      return new NextResponse(JSON.stringify({ error: "Utilizador não encontrado" }), {
        status: 404,
      });
    }

    // 2. Verificar Privacidade
    const isOwner = loggedInUserId === user.id;
    let isFollowing = false;
    if (loggedInUserId && !isOwner) {
      const follow = await prisma.follows.findUnique({ // Otimizado para findUnique se a chave composta existir
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
      return new NextResponse(
        JSON.stringify({ error: "Este perfil é privado." }),
        { status: 403 }
      );
    }

    // Opcional: Se o usuário escondeu a lista 'Watching', talvez queira esconder o cronograma também?
    // Mantive sua lógica original, mas é algo para pensar.
    /* if (!user.showWatchingList && !isOwner) {
       return NextResponse.json({ items: [], weekStart: ..., weekEnd: ... });
    }
    */

    // 3. Obter o weekOffset da URL
    const { searchParams } = new URL(request.url);
    const weekOffset = parseInt(searchParams.get('weekOffset') || '0');

    // 4. Calcular o intervalo de datas (Segunda a Domingo)
    const today = new Date();
    
    // A lógica de "pulo" de semana é mais segura usando addWeeks
    const targetDate = addWeeks(today, weekOffset);
    
    // weekStartsOn: 1 = Segunda-feira
    const startDate = startOfDay(startOfWeek(targetDate, { weekStartsOn: 1 }));
    const endDate = endOfDay(endOfWeek(targetDate, { weekStartsOn: 1 }));

    // 5. Buscar todos os itens DENTRO desse intervalo
    const scheduleItems = await prisma.scheduleItem.findMany({
      where: {
        userId: user.id,
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
        // Se quiser esconder itens completados do público:
        // isCompleted: isOwner ? undefined : false 
      },
      include: {
        media: true,
      },
      orderBy: [
        { scheduledAt: "asc" },
        // Se 'horario' for string, a ordenação pode não ser perfeita (ex: "10:00" vs "2:00"),
        // mas funciona bem para os padrões "1-Primeiro", "2-Segundo".
        { horario: "asc" }, 
      ],
    });

    // 6. Retorna os itens e as datas da semana (Formatadas em ISO para evitar problemas no front)
    return NextResponse.json({
      items: scheduleItems,
      weekStart: startDate.toISOString(), // Envia ISO completo
      weekEnd: endDate.toISOString(),     // Envia ISO completo
    });

  } catch (error) {
    console.error(`Erro ao buscar cronograma para ${username}:`, error);
    return new NextResponse(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500 }
    );
  }
}