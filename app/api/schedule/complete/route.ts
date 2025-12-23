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

    // 2. Busca se é semanal
    const mediaStatusInfo = await prisma.mediaStatus.findUnique({
        where: {
            userId_mediaId: { userId, mediaId }
        },
        select: { isWeekly: true }
    });

    const isWeekly = mediaStatusInfo?.isWeekly || false;

    // 3. Lógica Inteligente de Status
    if (isCompleted) {
      // Conta quantos itens AINDA faltam (excluindo o atual que já está true)
      const remainingItemsCount = await prisma.scheduleItem.count({
        where: {
          userId: userId,
          mediaId: mediaId,
          isCompleted: false,
        }
      });

      // Se NÃO for semanal e NÃO sobrar episódios -> Move para WATCHED
      // Se for semanal, ou ainda tiver episódios -> Mantém WATCHING
      let newStatus: 'WATCHED' | 'WATCHING' = 'WATCHING';
      if (!isWeekly && remainingItemsCount === 0) {
          newStatus = 'WATCHED';
      }
      
      await prisma.mediaStatus.update({
        where: { userId_mediaId: { userId, mediaId } },
        data: { 
            status: newStatus,
            watchedAt: newStatus === 'WATCHED' ? new Date() : null 
        }
      });
    } 
    else {
        // Se desmarcou, força volta para WATCHING
        await prisma.mediaStatus.update({
            where: { userId_mediaId: { userId, mediaId } },
            data: { status: 'WATCHING', watchedAt: null }
        });
    }

    // --- CORREÇÃO DE CACHE (CRUCIAL) ---
    revalidateTag(`mediastatus-${userId}`); // <--- Atualiza a lista MyLists
    revalidateTag(`schedule-${userId}`);    // <--- Atualiza a Agenda
    revalidateTag(`schedule`); 
    
    if (session.user.username) {
        const username = session.user.username.toLowerCase();
        revalidateTag(`user-profile-${username}`);
        revalidateTag(`simple-schedule-${username}`);
        revalidateTag(`overlay-${username}`);
    }

    return NextResponse.json(updatedItem);

  } catch (error) {
    console.error("[SCHEDULE_COMPLETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}