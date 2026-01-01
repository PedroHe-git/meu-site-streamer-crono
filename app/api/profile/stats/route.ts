// app/api/profile/stats/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { unstable_cache } from "next/cache"; // 👈 Importar Cache

export const runtime = 'nodejs';
// REMOVIDO: export const revalidate = 0; (Isso matava o banco)

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse("Não autorizado", { status: 401 });
  }
  
  const userId = session.user.id;

  try {
    
    // 👇 1. CACHE INTELIGENTE (Segura o banco dormindo)
    const getCachedStats = unstable_cache(
      async (uId: string) => {
        // Buscamos TODOS os dados de "assistido" de uma só vez.
        return await prisma.mediaStatus.findMany({
          where: {
            userId: uId,
            status: 'WATCHED',
            watchedAt: {
              not: null, 
            },
          },
          select: {
            watchedAt: true,
            media: { 
              select: {
                mediaType: true 
              }
            }
          }
        });
      },
      [`profile-stats-raw-${userId}`], // Chave única
      { 
        revalidate: 3600, // 👈 Cache de 1 HORA (Banco dorme feliz)
        tags: [`mediastatus-${userId}`] // Se você assistir algo novo, o cache limpa na hora!
      }
    );

    // 2. Usar a função cacheada
    const watchedItems = await getCachedStats(userId);

    // Agora, calculamos as estatísticas no servidor (CPU é grátis)
    
    // 1. Contagem total
    const totalWatched = watchedItems.length;

    // 2. Contagem por tipo
    const statsByType = watchedItems.reduce((acc, item) => {
      const type = item.media.mediaType; 
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 3. Dados do gráfico
    const watchedOverTimeData = watchedItems.map(item => ({
        watchedAt: item.watchedAt,
        mediaType: item.media.mediaType
    }));
    
    return NextResponse.json({
      totalWatched,
      statsByType,
      watchedOverTime: watchedOverTimeData,
    });

  } catch (error) {
    console.error("[STATS_GET]", error);
    return new NextResponse(JSON.stringify({ error: "Erro Interno" }), { status: 500 });
  }
}