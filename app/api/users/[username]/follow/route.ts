// app/api/users/[username]/follow/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions"; //
import prisma from '@/lib/prisma';
import { Prisma } from "@prisma/client";

// Configura o runtime e a região (necessário para o Prisma no Vercel)
export const runtime = 'nodejs';


/**
 * API para Seguir (Follow) ou Deixar de Seguir (Unfollow) um Criador.
 * A API "alterna" (toggles) o estado.
 */
export async function POST(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    // 1. OBTER O UTILIZADOR LOGADO (O SEGUIDOR)
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session || !session.user?.id) {
      return new NextResponse(JSON.stringify({ error: "Não autorizado. Faça login para seguir." }), { status: 401 });
    }
    // @ts-ignore
    const followerId = session.user.id;

    // 2. OBTER O CRIADOR A SER SEGUIDO (O "SEGUIDO")
    const { username } = params;
    if (!username) {
      return new NextResponse(JSON.stringify({ error: "Username do criador é obrigatório" }), { status: 400 });
    }

    const followingUser = await prisma.user.findUnique({
      where: { username: decodeURIComponent(username) },
      select: { id: true, role: true } // Apenas os campos necessários
    });

    if (!followingUser) {
      return new NextResponse(JSON.stringify({ error: "Criador não encontrado" }), { status: 404 });
    }
    
    // Regra de negócio: Apenas "CREATOR" pode ser seguido
    if (followingUser.role !== 'CREATOR') {
       return new NextResponse(JSON.stringify({ error: "Apenas Criadores podem ser seguidos" }), { status: 400 });
    }

    const followingId = followingUser.id;

    // 3. REGRA DE NEGÓCIO: UTILIZADOR NÃO PODE SEGUIR A SI MESMO
    if (followerId === followingId) {
      return new NextResponse(JSON.stringify({ error: "Não pode seguir a si mesmo" }), { status: 400 });
    }

    // 4. VERIFICAR SE JÁ SEGUE (LÓGICA DO "TOGGLE")
    // (Usa o modelo Follows)
    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: followingId,
        },
      },
    });

    let isFollowing: boolean;

    if (existingFollow) {
      // --- JÁ SEGUE: EXECUTAR "DEIXAR DE SEGUIR" (UNFOLLOW) ---
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: followerId,
            followingId: followingId,
          },
        },
      });
      isFollowing = false;
      console.log(`[FOLLOW] Utilizador ${followerId} deixou de seguir ${followingId}`);

    } else {
      // --- NÃO SEGUE: EXECUTAR "SEGUIR" (FOLLOW) ---
      await prisma.follows.create({
        data: {
          followerId: followerId,
          followingId: followingId,
        },
      });
      isFollowing = true;
      console.log(`[FOLLOW] Utilizador ${followerId} começou a seguir ${followingId}`);
    }

    // 5. RETORNAR O NOVO ESTADO
    return NextResponse.json({ isFollowing: isFollowing }, { status: 200 });

  } catch (error) {
    console.error("Erro na API de Seguir/Deixar de Seguir:", error);
    
    // Tratamento de erro específico do Prisma (ex: falha de constraint)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') { // Erro de constraint única
        return new NextResponse(JSON.stringify({ error: "Relação já existe (conflito)." }), { status: 409 });
      }
    }
    
    return new NextResponse(JSON.stringify({ error: "Erro interno do servidor." }), { status: 500 });
  }
}