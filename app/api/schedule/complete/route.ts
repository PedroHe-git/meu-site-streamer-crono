import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { scheduleId, isCompleted } = await request.json();
    const userId = session.user.id;

    if (!scheduleId) {
      return new NextResponse("Schedule ID is required", { status: 400 });
    }

    // 1. Atualiza o item do agendamento
    const updatedItem = await prisma.scheduleItem.update({
      where: { 
        id: scheduleId,
        userId: userId 
      },
      data: { isCompleted: isCompleted },
      select: { mediaId: true } 
    });

    const mediaId = updatedItem.mediaId;

    // 2. Busca informações do MediaStatus (para saber se é SEMANAL)
    const mediaStatusInfo = await prisma.mediaStatus.findUnique({
        where: {
            userId_mediaId: { userId, mediaId }
        },
        select: { isWeekly: true }
    });

    const isWeekly = mediaStatusInfo?.isWeekly || false;

    // 3. Lógica de Status
    if (isCompleted) {
      // Conta itens pendentes
      const remainingItemsCount = await prisma.scheduleItem.count({
        where: {
          userId: userId,
          mediaId: mediaId,
          isCompleted: false,
        }
      });

      // LÓGICA CORRIGIDA:
      // Se for Semanal (isWeekly === true) -> Mantém WATCHING sempre.
      // Se não for Semanal -> Verifica se acabou os itens (count === 0).
      let newStatus: 'WATCHED' | 'WATCHING' = 'WATCHING';

      if (!isWeekly && remainingItemsCount === 0) {
          newStatus = 'WATCHED';
      }
      
      // Se for semanal, ou se sobraram itens, ele fica/continua como WATCHING.

      await prisma.mediaStatus.update({
        where: { userId_mediaId: { userId, mediaId } },
        data: { 
            status: newStatus,
            // Só preenche a data de conclusão se realmente finalizou (WATCHED)
            watchedAt: newStatus === 'WATCHED' ? new Date() : null 
        }
      });
    } 
    else {
        // Se desmarcou, volta para WATCHING
        await prisma.mediaStatus.update({
            where: { userId_mediaId: { userId, mediaId } },
            data: { status: 'WATCHING', watchedAt: null }
        });
    }

    // Invalida caches
    revalidateTag(`dashboard-schedule-${userId}`);
    revalidateTag(`dashboard-lists-${userId}`);
    revalidateTag(`user-stats-${userId}`);
    if (session.user.username) {
    const username = session.user.username.toLowerCase();
    revalidateTag(`user-profile-${username}`);
    
    // --- ADICIONE ISTO ---
    revalidateTag(`overlay-${username}`); // Atualiza o OBS instantaneamente
    // ---------------------
}

    return NextResponse.json(updatedItem);

  } catch (error) {
    console.error("[SCHEDULE_COMPLETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}