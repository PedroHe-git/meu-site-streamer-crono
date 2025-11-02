// app/api/follows/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions"; //
import prisma from '@/lib/prisma';
import { Prisma } from "@prisma/client";

export const revalidate = 0;
// Configura o runtime e a região (necessário para o Prisma no Vercel)
export const runtime = 'nodejs';


/**
 * API para BUSCAR todos os criadores que o utilizador logado segue.
 */
export async function GET(request: Request) {
  try {
    // 1. OBTER O UTILIZADOR LOGADO (O SEGUIDOR)
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session || !session.user?.id) {
      // Se não estiver logado, retorna uma lista vazia em vez de um erro 401
      // pois a homepage pode chamar isto mesmo se o utilizador não estiver logado.
      return NextResponse.json([], { status: 200 });
    }
    // @ts-ignore
    const visitorId = session.user.id;

    // 2. BUSCAR OS 'FOLLOWS'
    // Encontra todos os registos onde o 'followerId' é o do nosso visitante
    const follows = await prisma.follows.findMany({
      where: {
        followerId: visitorId,
      },
      // 3. INCLUIR OS DADOS DO CRIADOR (O 'following')
      // (Usa a relação 'following' do modelo Follows)
      include: {
        following: {
          select: {
            username: true,
            name: true,
            image: true, // Se você quiser mostrar o avatar
          },
        },
      },
      take: 25, // Limita a 25 criadores por agora
      orderBy: {
        following: {
          name: 'asc', // Ordena por nome
        },
      },
    });

    // 4. Formata a resposta
    // Extrai apenas os dados do criador (o 'following') da resposta
    const creators = follows.map(f => f.following);

    return NextResponse.json(creators, { status: 200 });

  } catch (error) {
    console.error("Erro na API de buscar follows:", error);
    return new NextResponse(JSON.stringify({ error: "Erro interno do servidor." }), { status: 500 });
  }
}