import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { revalidateTag, unstable_cache } from "next/cache";

export const runtime = 'nodejs';

// GET: Busca itens agendados
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const listType = searchParams.get("list"); 
  const userId = session.user.id;

  try {
    const getCachedSchedule = unstable_cache(
      async () => {
        // Ajuste de "Hoje": Criamos a data baseada no UTC para evitar conflito de servidor
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0); 

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
           whereClause = { userId };
        }

        return await prisma.scheduleItem.findMany({
          where: whereClause,
          orderBy: { scheduledAt: "asc" },
          include: {
            media: {
              select: {
                id: true, title: true, posterPath: true, mediaType: true, totalSeasons: true, 
              },
            },
          },
        });
      },
      [`schedule-${userId}`, `list-${listType}`],
      { tags: [`schedule-${userId}`, 'schedule'], revalidate: 3600 }
    );

    const items = await getCachedSchedule();

    const mediaIds = Array.from(new Set(items.map(item => item.mediaId)));
    const mediaStatuses = await prisma.mediaStatus.findMany({ where: { userId, mediaId: { in: mediaIds } }, select: { mediaId: true, isWeekly: true } });
    const weeklyMap = new Map(mediaStatuses.map(s => [s.mediaId, s.isWeekly]));
    const enrichedItems = items.map(item => ({ ...item, isWeekly: weeklyMap.get(item.mediaId) || false }));

    return NextResponse.json(enrichedItems);

  } catch (error) {
    console.error("[SCHEDULE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST: Cria novo agendamento
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { mediaId, scheduledAt, horario, seasonNumber, episodeNumber, episodeNumberEnd } = await request.json();

    if (!mediaId || !scheduledAt) return new NextResponse("Dados inválidos", { status: 400 });

    // 👇 AQUI ESTÁ A CORREÇÃO PARA MANAUS E BRASIL
    const scheduledDate = new Date(scheduledAt);
    // Forçamos 12:00 UTC.
    // Manaus (UTC-4) verá isso como 08:00 da manhã do MESMO DIA.
    scheduledDate.setUTCHours(12, 0, 0, 0);
    
    const newItem = await prisma.scheduleItem.create({
      data: {
        userId: session.user.id,
        mediaId: mediaId,
        scheduledAt: scheduledDate,
        horario: horario || null,
        seasonNumber: seasonNumber || null,
        episodeNumber: episodeNumber || null,
        episodeNumberEnd: episodeNumberEnd || null,
        isCompleted: false
      }
    });

    revalidateTag('schedule');
    revalidateTag(`schedule-${session.user.id}`);
    if (session.user.username) {
        const username = session.user.username.toLowerCase();
        revalidateTag(`simple-schedule-${username}`);
        revalidateTag(`overlay-${username}`);
    }

    return NextResponse.json(newItem);

  } catch (error) {
    console.error("[SCHEDULE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// PATCH: Atualiza status (Mantido igual)
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { id, isCompleted, mediaId, isFinale } = await request.json();
    if (!id) return new NextResponse("ID faltando", { status: 400 });

    const updatedItem = await prisma.scheduleItem.update({
      where: { id, userId: session.user.id },
      data: { isCompleted }
    });

    if (mediaId) {
        const mediaStatus = await prisma.mediaStatus.findUnique({
            where: { userId_mediaId: { userId: session.user.id, mediaId } }
        });

        if (isCompleted && updatedItem.seasonNumber && mediaStatus) {
            const currentProgress = (mediaStatus.seasonProgress as Record<string, boolean>) || {};
            const strSeason = updatedItem.seasonNumber.toString();

            if (isFinale === true) {
                currentProgress[strSeason] = true;
            } else if (isFinale === false) {
                if (currentProgress[strSeason]) delete currentProgress[strSeason]; 
            }
            
            const watchedSeasons = Object.keys(currentProgress).map(Number);
            const maxSeason = Math.max(...watchedSeasons, updatedItem.seasonNumber);

            await prisma.mediaStatus.update({
                where: { id: mediaStatus.id },
                data: { seasonProgress: currentProgress, lastSeasonWatched: maxSeason }
            });
        }
        // ... (resto da lógica de status mantida)
        let newStatus: 'WATCHED' | 'WATCHING' | null = null;
        if (isCompleted) {
            if (isFinale === true) newStatus = 'WATCHED';
            else if (isFinale === false) newStatus = 'WATCHING';
            else {
                const pendingCount = await prisma.scheduleItem.count({ where: { userId: session.user.id, mediaId, isCompleted: false } });
                if (mediaStatus && !mediaStatus.isWeekly && pendingCount === 0) newStatus = 'WATCHED';
            }
        } else {
            newStatus = 'WATCHING';
        }
        if (newStatus) {
            await prisma.mediaStatus.update({
                where: { userId_mediaId: { userId: session.user.id, mediaId } },
                data: { status: newStatus, watchedAt: newStatus === 'WATCHED' ? new Date() : null }
            });
        }
    }
    revalidateTag('schedule'); revalidateTag(`schedule-${session.user.id}`); revalidateTag(`mediastatus-${session.user.id}`);
    if (session.user.username) { const u = session.user.username.toLowerCase(); revalidateTag(`simple-schedule-${u}`); revalidateTag(`overlay-${u}`); }

    return NextResponse.json(updatedItem);
  } catch (error) { return new NextResponse("Internal Error", { status: 500 }); }
}

// DELETE: Apaga item
export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Acesso Negado", { status: 403 });
    const { searchParams } = new URL(request.url); const id = searchParams.get("id");
    if (!id) return new NextResponse("ID faltando", { status: 400 });
    try {
      await prisma.scheduleItem.delete({ where: { id, userId: session.user.id } });
      revalidateTag('schedule'); revalidateTag(`schedule-${session.user.id}`); revalidateTag(`mediastatus-${session.user.id}`); 
      if (session.user.username) { const u = session.user.username.toLowerCase(); revalidateTag(`user-profile-${u}`); revalidateTag(`simple-schedule-${u}`); revalidateTag(`overlay-${u}`); }
      return NextResponse.json({ success: true });
    } catch (error) { return new NextResponse("Erro ao deletar", { status: 500 }); }
}