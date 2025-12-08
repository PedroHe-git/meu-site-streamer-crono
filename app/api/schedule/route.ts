import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { revalidateTag, unstable_cache } from "next/cache"; 

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Não autorizado", { status: 401 });

  const { searchParams } = new URL(request.url);
  const listType = searchParams.get("list"); // 'pending' ou 'completed'
  const userId = session.user.id;

  try {
    // Cache da agenda do usuário logado
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
            revalidate: 3600, // 1 hora
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

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Não autorizado", { status: 401 });

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

    // INVALIDAÇÃO
    revalidateTag(`dashboard-schedule-${userId}`);
    if (session.user.username) {
   const username = session.user.username.toLowerCase();
   revalidateTag(`user-profile-${username}`);
   
   // --- ADICIONE ISTO ---
   revalidateTag(`overlay-${username}`); 
   // ---------------------
}

    return NextResponse.json(newScheduleItem);
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    return new NextResponse("Erro Interno", { status: 500 });
  }
}

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse("Não autorizado", { status: 401 });
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return new NextResponse("ID faltando", { status: 400 });

    try {
      const item = await prisma.scheduleItem.findUnique({ where: { id }});
      if (!item || item.userId !== session.user.id) {
          return new NextResponse("Proibido", { status: 403 });
      }

      await prisma.scheduleItem.delete({ where: { id } });

      // INVALIDAÇÃO
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