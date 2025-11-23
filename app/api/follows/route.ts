import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from '@/lib/prisma';
import { unstable_cache } from "next/cache";

// Removemos o revalidate = 0 para permitir o cache
// export const revalidate = 0; 

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json([], { status: 200 });
    }
    
    const visitorId = session.user.id;

    // Cacheia a lista de quem o usuário segue
    // Chave única por usuário: `user-follows-${visitorId}`
    const getCachedFollows = unstable_cache(
      async () => {
        const follows = await prisma.follows.findMany({
          where: {
            followerId: visitorId,
          },
          include: {
            following: {
              select: {
                username: true,
                name: true,
                image: true,
              },
            },
          },
          take: 50, // Limite seguro
          orderBy: {
            following: {
              name: 'asc',
            },
          },
        });
        return follows.map(f => f.following);
      },
      [`user-follows-${visitorId}`], 
      { 
        revalidate: 3600, // Cache de 1 hora (ou até ser revalidado manualmente)
        tags: [`user-follows-${visitorId}`] 
      }
    );

    const creators = await getCachedFollows();

    return NextResponse.json(creators, { status: 200 });

  } catch (error) {
    console.error("Erro na API de buscar follows:", error);
    return new NextResponse(JSON.stringify({ error: "Erro interno do servidor." }), { status: 500 });
  }
}