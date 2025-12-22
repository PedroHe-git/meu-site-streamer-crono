import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { revalidateTag, unstable_cache } from "next/cache";
import { UserRole } from "@prisma/client"; // 👈 Importante importar isso

export const runtime = 'nodejs';

// GET: Permite que o usuário veja a PRÓPRIA agenda (Seguro, pois filtra por userId)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Não autorizado", { status: 401 });

  const { searchParams } = new URL(request.url);
  const listType = searchParams.get("list"); // 'pending' ou 'completed'
  const userId = session.user.id;

  try {
    const getCachedSchedule = unstable_cache(
        async () => {
            return await prisma.scheduleItem.findMany({
                where: {
                  userId: userId,
                  ...(listType === 'pending' ? { isCompleted: false } : {}),
                  ...(listType === 'completed' ? { isCompleted: true } : {}),
                },
                include: { media: true },
                orderBy: { scheduledAt: 'asc' },
              });
        },
        [`schedule-${userId}-${listType || 'all'}`],
        {
            revalidate: 3600,
            tags: [`dashboard-schedule-${userId}`] 
        }
    );

    const scheduleItems = await getCachedSchedule();
    return NextResponse.json(scheduleItems);
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    return new NextResponse("Erro Interno", { status: 500 });
  }
}

// POST: Apenas o CREATOR pode criar itens (Segurança Adicionada)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  // 👇 TRAVA DE SEGURANÇA: Só o Creator pode adicionar
  if (!session || session.user.role !== UserRole.CREATOR) {
    return new NextResponse("Acesso Negado: Apenas o Streamer pode editar a agenda.", { status: 403 });
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

    // Invalida cache
    revalidateTag(`dashboard-schedule-${userId}`);
    if (session.user.username) {
       const username = session.user.username.toLowerCase();
       revalidateTag(`user-profile-${username}`);
       revalidateTag(`overlay-${username}`); 
    }

    return NextResponse.json(newScheduleItem);
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    return new NextResponse("Erro Interno", { status: 500 });
  }
}

// DELETE: Apenas o CREATOR pode apagar itens (Segurança Adicionada)
export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    
    // 👇 TRAVA DE SEGURANÇA
    if (!session || session.user.role !== UserRole.CREATOR) {
        return new NextResponse("Acesso Negado", { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return new NextResponse("ID faltando", { status: 400 });

    try {
      const item = await prisma.scheduleItem.findUnique({ where: { id }});
      
      // Verifica se o item pertence ao usuário logado (segurança extra)
      if (!item || item.userId !== session.user.id) {
          return new NextResponse("Proibido", { status: 403 });
      }

      await prisma.scheduleItem.delete({ where: { id } });

      revalidateTag(`dashboard-schedule-${session.user.id}`);
      if (session.user.username) {
        revalidateTag(`user-profile-${session.user.username.toLowerCase()}`);
      }
  
      return NextResponse.json({ success: true });
    } catch (error) { 
        console.error("Erro ao apagar:", error);
        return new NextResponse("Erro Interno", { status: 500 }); 
    }
}