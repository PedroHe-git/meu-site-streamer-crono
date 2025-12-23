import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { revalidateTag, unstable_cache } from "next/cache";
import { UserRole } from "@prisma/client";

export const runtime = 'nodejs';

// GET: Busca itens agendados (Futuros OU Passados não concluídos)
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

        let whereClause: any = { userId }; // Filtra sempre pelo usuário logado

        if (listType === 'pending') {
          whereClause = {
            userId,
            OR: [
              { scheduledAt: { gte: today } }, // Itens de hoje em diante
              { isCompleted: false }           // ⚡ Itens do passado que ainda estão pendentes
            ]
          };
        } else if (listType === 'history') {
          whereClause = {
            userId,
            isCompleted: true
          };
        } else {
           // Padrão: Próximos itens e pendências
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
          orderBy: { scheduledAt: 'asc' },
          take: 50 // Aumentado para suportar itens acumulados
        });
      },
      [`schedule-${userId}-${listType || 'default'}`], 
      {
        revalidate: 3600,
        tags: ['schedule'] // Tag global para revalidação
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
  
  if (!session || session.user.role !== UserRole.CREATOR) {
    return new NextResponse("Acesso Negado", { status: 403 });
  }

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

    // ⚡ INVALIDAÇÃO DE CACHE
    revalidateTag('schedule'); 
    if (session.user.username) {
       const username = session.user.username.toLowerCase();
       revalidateTag(`user-profile-${username}`);
       revalidateTag(`simple-schedule-${username}`);
    }

    return NextResponse.json(newScheduleItem);
  } catch (error) {
    return new NextResponse("Erro Interno", { status: 500 });
  }
}

// PATCH: Para concluir itens (Resolve o problema de não conseguir dar concluído)
export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.CREATOR) return new NextResponse("Negado", { status: 403 });

    try {
        const { id, isCompleted } = await request.json();
        const updated = await prisma.scheduleItem.update({
            where: { id, userId: session.user.id },
            data: { isCompleted }
        });

        // ⚡ Limpa o cache para o item sumir da lista de pendentes
        revalidateTag('schedule');
        if (session.user.username) {
            revalidateTag(`simple-schedule-${session.user.username.toLowerCase()}`);
        }

        return NextResponse.json(updated);
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
      if (session.user.username) {
        revalidateTag(`user-profile-${session.user.username.toLowerCase()}`);
      }
  
      return NextResponse.json({ success: true });
    } catch (error) { 
        return new NextResponse("Erro Interno", { status: 500 }); 
    }
}