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
    const { scheduleId, isCompleted, isFinale } = await request.json();
    const userId = session.user.id;

    if (!scheduleId) {
      return new NextResponse("Schedule ID is required", { status: 400 });
    }

    // 1. Atualiza o card da Agenda (Sempre marca como feito ou desfeito)
    const updatedItem = await prisma.scheduleItem.update({
      where: { 
        id: scheduleId,
        userId: userId 
      },
      data: { isCompleted: isCompleted },
      select: { mediaId: true } 
    });

    const mediaId = updatedItem.mediaId;

    // 2. Busca info da Mídia
    const mediaStatusInfo = await prisma.mediaStatus.findUnique({
        where: { userId_mediaId: { userId, mediaId } },
        select: { isWeekly: true }
    });
    const isWeekly = mediaStatusInfo?.isWeekly || false;

    // 3. Lógica de Status (Sem somar episódios)
    if (isCompleted) {
        let newStatus: 'WATCHED' | 'WATCHING' = 'WATCHING';

        if (isFinale === true) {
            // Se usuário disse "SIM": Move para Concluído
            newStatus = 'WATCHED';
        } else if (isFinale === false) {
            // Se usuário disse "NÃO": Mantém Assistindo (não faz mais nada)
            newStatus = 'WATCHING';
        } else {
            // Fallback (se não tiver resposta do popout):
            // Só conclui se não tiver mais nada agendado pendente
            const remainingItemsCount = await prisma.scheduleItem.count({
                where: { userId, mediaId, isCompleted: false }
            });
            if (!isWeekly && remainingItemsCount === 0) {
                newStatus = 'WATCHED';
            }
        }
      
        await prisma.mediaStatus.update({
            where: { userId_mediaId: { userId, mediaId } },
            data: { 
                status: newStatus,
                watchedAt: newStatus === 'WATCHED' ? new Date() : null,
                updatedAt: new Date()
            }
        });
    } 
    else {
        // Se desmarcou o check: Volta para Assistindo
        await prisma.mediaStatus.update({
            where: { userId_mediaId: { userId, mediaId } },
            data: { status: 'WATCHING', watchedAt: null }
        });
    }

    // Cache Revalidation
    revalidateTag(`mediastatus-${userId}`);
    revalidateTag(`schedule-${userId}`);
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