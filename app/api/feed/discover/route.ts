import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { unstable_cache } from "next/cache"; // Importa o cache

// Removemos 'force-dynamic' para permitir o cache
// export const dynamic = 'force-dynamic'; 

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  try {
    // Cacheia a busca de "Descobrir" por 1 hora (3600s)
    // Usamos uma chave que inclui o userId (se houver) para que a exclusão de quem ele já segue funcione
    // Se não houver userId (visitante), usa uma chave genérica
    const cacheKey = userId ? `discover-feed-${userId}` : 'discover-feed-public';

    const getCachedDiscovery = unstable_cache(
      async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        const creators = await prisma.user.findMany({
          where: {
            role: 'CREATOR',
            // Excluir a mim mesmo (se logado)
            ...(userId && { NOT: { id: userId } }),
            // Excluir quem eu já sigo (se logado)
            ...(userId && {
                followers: {
                    none: { followerId: userId } 
                }
            }),
            // Apenas quem tem itens agendados nesta semana
            scheduleItems: {
              some: {
                scheduledAt: { gte: today, lte: nextWeek },
                isCompleted: false
              }
            }
          },
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
            twitchUsername: true,
            // Contagem de itens para mostrar no card
            scheduleItems: {
                where: {
                    scheduledAt: { gte: today, lte: nextWeek },
                    isCompleted: false
                },
                select: { id: true }
            }
          },
          take: 6 // Limite de sugestões
        });

        // Formatação igual à rota 'following'
        return creators.map(user => ({
            id: user.id,
            username: user.username,
            name: user.name,
            image: user.image,
            twitchUsername: user.twitchUsername,
            itemCount: user.scheduleItems.length
        }));
      },
      [cacheKey], 
      { 
        revalidate: 3600, // Cache de 1 hora
        tags: ['discover-feed', userId ? `discover-${userId}` : 'discover-public'] 
      }
    );

    const formattedCreators = await getCachedDiscovery();

    return NextResponse.json(formattedCreators);
  } catch (error) {
    console.error(error);
    return new NextResponse("Erro", { status: 500 });
  }
}