import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const runtime = 'nodejs';
// REMOVIDO: export const revalidate = 0; (Isso matava o banco)

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const { username } = params;
  // Normalizar para garantir que o cache funcione independente de maiúsculas/minúsculas
  const normalizedUsername = decodeURIComponent(username).toLowerCase();

  try {
    // ⚡ CACHE NESTA FUNÇÃO
    const getCachedSimpleSchedule = unstable_cache(
      async () => {
        // 1. Busca o ID do usuário
        const user = await prisma.user.findFirst({
          where: { 
            username: { 
              equals: normalizedUsername, 
              mode: 'insensitive' 
            } 
          },
          select: { id: true } 
        });

        if (!user) return null;

        // 2. Busca os itens (Lógica mantida)
        return await prisma.scheduleItem.findMany({
          where: {
            userId: user.id,
          },
          include: {
            media: true, 
          },
          orderBy: {
            scheduledAt: 'asc', 
          },
          take: 25, 
        });
      },
      [`simple-schedule-${normalizedUsername}`], // Chave única
      {
        revalidate: 3600, // 1 Hora de cache
        tags: [`schedule-${normalizedUsername}`, 'schedule'] // Tags para invalidar
      }
    );

    const scheduleItems = await getCachedSimpleSchedule();

    if (!scheduleItems) {
      return new NextResponse("Utilizador não encontrado", { status: 404 });
    }

    return NextResponse.json(scheduleItems);

  } catch (error) {
    console.error("[SIMPLE_SCHEDULE_GET]", error);
    return new NextResponse(JSON.stringify({ error: "Erro Interno" }), { status: 500 });
  }
}