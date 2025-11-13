// app/api/profile/stats/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export const runtime = 'nodejs';
export const revalidate = 0; // Não fazer cache, sempre buscar dados frescos

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session?.user?.id) {
    return new NextResponse("Não autorizado", { status: 401 });
  }
  // @ts-ignore
  const userId = session.user.id;

  try {
    
    // --- [INÍCIO DA CORREÇÃO] ---
    // Buscamos TODOS os dados de "assistido" de uma só vez.
    // Isto substitui as 3 queries separadas.
    const watchedItems = await prisma.mediaStatus.findMany({
      where: {
        userId: userId,
        status: 'WATCHED',
        watchedAt: {
          not: null, // Garante que só pegamos itens com data
        },
      },
      select: {
        watchedAt: true,
        media: { // Inclui a mídia relacionada
          select: {
            mediaType: true // E seleciona o mediaType de dentro dela
          }
        }
      }
    });

    // Agora, calculamos as estatísticas no servidor usando JavaScript
    
    // 1. Contagem total
    const totalWatched = watchedItems.length;

    // 2. Contagem por tipo (para o gráfico de pizza)
    const statsByType = watchedItems.reduce((acc, item) => {
      const type = item.media.mediaType; // Pega o tipo da mídia aninhada
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 3. Dados do gráfico (Itens assistidos ao longo do tempo)
    // Formatamos os dados para o frontend.
    const watchedOverTimeData = watchedItems.map(item => ({
        watchedAt: item.watchedAt,
        mediaType: item.media.mediaType
    }));
    
    // --- [FIM DA CORREÇÃO] ---

    return NextResponse.json({
      totalWatched,
      statsByType,
      watchedOverTime: watchedOverTimeData, // Passa os dados formatados
    });

  } catch (error) {
    console.error("[STATS_GET]", error);
    // Este console.error agora mostrará o erro do Prisma no seu terminal Vercel
    return new NextResponse(JSON.stringify({ error: "Erro Interno" }), { status: 500 });
  }
}