import { NextResponse, NextRequest } from "next/server";
import prisma from '@/lib/prisma';
import { UserRole } from "@prisma/client"; // Importa o enum


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


// GET /api/users/search?q=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // Se não houver query, retorna lista vazia ou os mais recentes?
    // Por agora, retorna vazio se a query for muito curta.
    if (!query || query.length < 2) {
      return NextResponse.json([]); // Retorna array vazio
    }

    // Busca utilizadores que são CREATORs
    // E cujo username OU name contenham a query (case-insensitive)
    const creators = await prisma.user.findMany({
      where: {
        role: UserRole.CREATOR, // Apenas criadores
        OR: [ // Procura no username OU no name
          {
            username: {
              contains: query,
              mode: 'insensitive', // Ignora maiúsculas/minúsculas
            }
          },
          {
            name: {
              contains: query,
              mode: 'insensitive',
            }
          }
        ]
      },
      select: { // Retorna apenas dados públicos e necessários
        username: true,
        name: true,
        image: true, // Pode ser útil mostrar o avatar
      },
      take: 10, // Limita o número de resultados
      orderBy: {
         name: 'asc' // Ordena por nome
      }
    });

    return NextResponse.json(creators);

  } catch (error) {
    console.error("Erro ao pesquisar criadores:", error);
    return new NextResponse(JSON.stringify({ error: "Erro interno ao pesquisar" }), { status: 500 });
  }
}
