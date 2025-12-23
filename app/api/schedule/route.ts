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
            { horario: 'asc' }
          ],
          take: 20
        });
      },
      [`schedule-${userId}-${listType || 'default'}`], 
      {
        revalidate: 3600,
        tags: [`schedule-${userId}`, 'schedule'] 
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

    // CACHE UPDATE
    revalidateTag('schedule'); 
    revalidateTag(`schedule-${userId}`);
    revalidateTag(`mediastatus-${userId}`); // Atualiza lista caso afete status

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

// PATCH: Concluir/Editar Item (Com Lógica Inteligente)
export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.CREATOR) return new NextResponse("Negado", { status: 403 });

    try {
        const { id, isCompleted, mediaId } = await request.json();
        const userId = session.user.id;

        // 1. Atualiza Schedule
        const updatedSchedule = await prisma.scheduleItem.update({
            where: { id, userId },
            data: { isCompleted }
        });

        // 2. Atualiza MediaStatus (se necessário)
        if (mediaId) {
            if (isCompleted) {
                const mediaStatus = await prisma.mediaStatus.findUnique({
                    where: { userId_mediaId: { userId, mediaId } },
                    select: { isWeekly: true }
                });
                
                const pendingCount = await prisma.scheduleItem.count({
                    where: { userId, mediaId, isCompleted: false }
                });

                if (!mediaStatus?.isWeekly && pendingCount === 0) {
                    await prisma.mediaStatus.update({
                        where: { userId_mediaId: { userId, mediaId } },
                        data: { status: 'WATCHED', watchedAt: new Date() }
                    });
                } else {
                    // Garante que fique em WATCHING
                     await prisma.mediaStatus.update({
                        where: { userId_mediaId: { userId, mediaId } },
                        data: { status: 'WATCHING' }
                    });
                }
            } else {
                // Voltou atrás
                await prisma.mediaStatus.update({
                    where: { userId_mediaId: { userId, mediaId } },
                    data: { status: 'WATCHING', watchedAt: null }
                });
            }
        }

        // --- CACHE UPDATE ---
        revalidateTag('schedule');
        revalidateTag(`schedule-${userId}`);
        revalidateTag(`mediastatus-${userId}`); // <--- CRUCIAL

        if (session.user.username) {
            const userTag = session.user.username.toLowerCase();
            revalidateTag(`user-profile-${userTag}`);
            revalidateTag(`simple-schedule-${userTag}`);
            revalidateTag(`overlay-${userTag}`);
        }

        return NextResponse.json(updatedSchedule);
    } catch (error) {
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
      revalidateTag(`mediastatus-${session.user.id}`); // Previne dados órfãos na lista
      
      if (session.user.username) {
        const userTag = session.user.username.toLowerCase();
        revalidateTag(`user-profile-${userTag}`);
        revalidateTag(`simple-schedule-${userTag}`);
      }
  
      return NextResponse.json({ success: true });
    } catch (error) { 
        return new NextResponse("Erro Interno", { status: 500 }); 
    }
}