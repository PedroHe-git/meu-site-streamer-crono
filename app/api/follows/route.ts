import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from '@/lib/prisma';
import { unstable_cache } from "next/cache"; // Importar cache

export const revalidate = 0; // Removemos este revalidate forçado de 0

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json([], { status: 200 });
    }
    
    const visitorId = session.user.id;

    // --- CACHE: Lista de quem sigo ---
    // Cacheia por 1 hora ou até o usuário seguir alguém novo (usando tags seria ideal, mas por tempo vamos de tempo fixo curto ou revalidação)
    // Vamos usar unstable_cache para cachear essa consulta específica por usuário
    const getCachedFollows = unstable_cache(
      async () => {
        return await prisma.follows.findMany({
          where: { followerId: visitorId },
          include: {
            following: {
              select: { username: true, name: true, image: true },
            },
          },
          take: 50,
          orderBy: { following: { name: 'asc' } },
        });
      },
      [`user-follows-${visitorId}`], // Chave única
      { 
        revalidate: 600, // Cache de 10 minutos (suficiente para não bater no banco a cada clique)
        tags: [`user-follows-${visitorId}`] 
      } 
    );

    const follows = await getCachedFollows();
    const creators = follows.map(f => f.following);

    return NextResponse.json(creators, { status: 200 });

  } catch (error) {
    console.error("Erro na API de buscar follows:", error);
    return new NextResponse(JSON.stringify({ error: "Erro interno" }), { status: 500 });
  }
}