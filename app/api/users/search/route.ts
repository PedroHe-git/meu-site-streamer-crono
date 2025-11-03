// app/api/users/search/route.ts (Corrigido)

import { NextResponse, NextRequest } from "next/server";
import prisma from '@/lib/prisma';
import { UserRole } from "@prisma/client";

export const revalidate = 0;
export const runtime = 'nodejs';

// GET /api/users/search?q=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // --- [ESTA É A LINHA CRÍTICA] ---
    // Deve ser .get('q') para coincidir com o fetch
    const query = searchParams.get('q');
    // --- [FIM DA CORREÇÃO] ---

    // Se não houver query, ou for muito curta, retorna array vazio (200 OK)
    if (!query || query.length < 2) {
      return NextResponse.json([]); 
    }

    // Busca utilizadores que são CREATORs
    // E cujo username OU name contenham a query (case-insensitive)
    const creators = await prisma.user.findMany({
      where: {
        role: UserRole.CREATOR, // Apenas criadores
        username: {
            contains: query,
            mode: 'insensitive', // Ignora maiúsculas/minúsculas
        },
        // (O seu ficheiro original só procurava no username,
        //  mas pode adicionar a procura no 'name' se quiser)
        // OR: [ 
        //   { username: { contains: query, mode: 'insensitive' } },
        //   { name: { contains: query, mode: 'insensitive' } }
        // ]
      },
      select: { 
        username: true,
        name: true,
        image: true,
      },
      take: 10, 
      orderBy: {
         name: 'asc' 
      }
    });

    return NextResponse.json(creators);

  } catch (error) {
    console.error("Erro ao pesquisar criadores:", error);
    return new NextResponse(JSON.stringify({ error: "Erro interno ao pesquisar" }), { status: 500 });
  }
}