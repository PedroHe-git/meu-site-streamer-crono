import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const { username } = params;
  // Normalizar para minúsculas para garantir consistência nas tags
  const normalizedUsername = decodeURIComponent(username).toLowerCase();

  try {
    // Envolvemos a busca pesada no cache
    const getCachedOverlayData = unstable_cache(
      async () => {
        // 1. Busca o ID do usuário
        const user = await prisma.user.findFirst({
          where: { username: { equals: normalizedUsername, mode: 'insensitive' } },
          select: { id: true }
        });

        if (!user) return null;

        // 2. Define o intervalo de "HOJE"
        const now = new Date();
        const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);

        // 3. Busca itens pendentes
        const todaysItems = await prisma.scheduleItem.findMany({
          where: {
            userId: user.id,
            scheduledAt: { gte: startOfDay, lte: endOfDay },
            isCompleted: false // Apenas o que falta
          },
          include: { media: true },
          orderBy: [{ horario: 'asc' }, { scheduledAt: 'asc' }]
        });

        const currentItem = todaysItems.length > 0 ? todaysItems[0] : null;
        const nextItem = todaysItems.length > 1 ? todaysItems[1] : null;

        return { current: currentItem, next: nextItem };
      },
      [`overlay-data-${normalizedUsername}`], // Chave única do cache
      {
        revalidate: 86400, // Cache válido por 24 horas (só atualiza se nós mandarmos)
        tags: [`overlay-${normalizedUsername}`] // A "Etiqueta" mágica para limpar o cache
      }
    );

    const data = await getCachedOverlayData();

    if (!data) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(data);

  } catch (error) {
    console.error("[OVERLAY_API]", error);
    return new NextResponse("Erro Interno", { status: 500 });
  }
}