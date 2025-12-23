import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { revalidateTag, unstable_cache } from "next/cache";
import { UserRole } from "@prisma/client";

export const runtime = 'nodejs';

// GET: Busca itens agendados
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  
  const { searchParams } = new URL(request.url);
  const listType = searchParams.get("list"); 
  const userId = session.user.id;

  try {
    const getCachedSchedule = unstable_cache(
      async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let whereClause: any = { userId };

        if (listType === 'pending') {
          whereClause = {
            userId,
            OR: [
              { scheduledAt: { gte: today } },
              { isCompleted: false }
            ]
          };
        } else if (listType === 'history') {
          whereClause = { userId, isCompleted: true };
        } else {
           whereClause = { 
             userId,
             OR: [
               { scheduledAt: { gte: today } },
               { isCompleted: false }
             ]
           };
        }

        return await prisma.scheduleItem.findMany({
          where: whereClause,
          include: { media: true },
          orderBy: [
            { scheduledAt: 'asc' },
            { horario: 'asc' } // <-- Adicione isso
          ],
          take: 20
        });
      },
      [`schedule-${userId}-${listType || 'default'}`], 
      {
        revalidate: 3600,
        tags: [`schedule-${userId}`, 'schedule'] // Tag específica do usuário + tag global
      }
    );

    const schedule = await getCachedSchedule();
    return NextResponse.json(schedule);
  } catch (error) {
    return new NextResponse("Erro na Agenda", { status: 500 });
  }
}

// POST: Cria novo item
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== UserRole.CREATOR) return new NextResponse("Acesso Negado", { status: 403 });

  try {
    const body = await request.json();
    const { mediaId, scheduledAt, horario, seasonNumber, episodeNumber, episodeNumberEnd } = body;
    const userId = session.user.id;

    if (!mediaId || !scheduledAt) return new NextResponse("Dados inválidos", { status: 400 });

    const newScheduleItem = await prisma.scheduleItem.create({
      data: {
        userId,
        mediaId,
        scheduledAt: new Date(scheduledAt),
        horario: horario || null,
        seasonNumber: seasonNumber ? parseInt(seasonNumber) : null,
        episodeNumber: episodeNumber ? parseInt(episodeNumber) : null,
        episodeNumberEnd: episodeNumberEnd ? parseInt(episodeNumberEnd) : null,
        isCompleted: false,
      },
      include: { media: true }
    });

    // LIMPEZA DE CACHE
    revalidateTag('schedule'); 
    revalidateTag(`schedule-${userId}`);
    if (session.user.username) {
       const userTag = session.user.username.toLowerCase();
       revalidateTag(`user-profile-${userTag}`);
       revalidateTag(`simple-schedule-${userTag}`);
    }

    return NextResponse.json(newScheduleItem);
  } catch (error) {
    return new NextResponse("Erro Interno", { status: 500 });
  }
}

// PATCH: Concluir Item (Correção da Transação e Cache)
export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.CREATOR) return new NextResponse("Negado", { status: 403 });

    try {
        const { id, isCompleted, mediaId } = await request.json();
        const userId = session.user.id;

        // Lógica condicional para o status da mídia
        let mediaUpdateData = {};
        
        if (isCompleted) {
            // Se está CONCLUINDO:
            mediaUpdateData = { 
                status: 'WATCHED', 
                watchedAt: new Date(), 
                updatedAt: new Date() 
            };
        } else {
            // Se está DESFAZENDO (Voltando para pendente):
            mediaUpdateData = { 
                status: 'WATCHING', // Volta para "Assistindo"
                watchedAt: null,    // Remove a data de conclusão
                updatedAt: new Date() 
            };
        }

        const [updatedSchedule] = await prisma.$transaction([
            prisma.scheduleItem.update({
                where: { id, userId },
                data: { isCompleted }
            }),
            // Só atualiza a mídia se tiver mediaId
            ...(mediaId ? [
                prisma.mediaStatus.update({
                    where: { userId_mediaId: { userId, mediaId } },
                    data: mediaUpdateData
                })
            ] : [])
        ]);

        // Revalida tudo para a interface atualizar instantaneamente
        revalidateTag('schedule');
        revalidateTag(`schedule-${userId}`);
        revalidateTag(`mediastatus-${userId}`); 

        if (session.user.username) {
            const userTag = session.user.username.toLowerCase();
            revalidateTag(`user-profile-${userTag}`);
            revalidateTag(`simple-schedule-${userTag}`);
        }

        return NextResponse.json(updatedSchedule);
    } catch (error) {
        console.error("Erro no PATCH schedule:", error);
        return new NextResponse("Erro", { status: 500 });
    }
}

// DELETE: Apaga item
export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.CREATOR) return new NextResponse("Acesso Negado", { status: 403 });
    
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return new NextResponse("ID faltando", { status: 400 });

    try {
      await prisma.scheduleItem.delete({ 
          where: { id, userId: session.user.id } 
      });

      revalidateTag('schedule');
      revalidateTag(`schedule-${session.user.id}`);
      // Opcional: Se deletar da agenda devia mudar o status da lista? Geralmente não.
      
      if (session.user.username) {
        revalidateTag(`user-profile-${session.user.username.toLowerCase()}`);
      }
  
      return NextResponse.json({ success: true });
    } catch (error) { 
        return new NextResponse("Erro Interno", { status: 500 }); 
    }
}