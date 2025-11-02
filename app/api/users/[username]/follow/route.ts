// app/api/users/[username]/follow/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from '@/lib/prisma';
import { UserRole } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: { username: string } }
) {
  const session = await getServerSession(authOptions);

  // 1. O utilizador que segue (da sessão) tem de estar logado
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Não autorizado" }), {
      status: 401,
    });
  }
  
  const followerId = session.user.id;

  try {
    // 2. O utilizador a ser seguido (o alvo) tem de existir e ser um CREATOR
    const targetCreator = await prisma.user.findUnique({
      where: {
        username: decodeURIComponent(params.username),
        role: UserRole.CREATOR, // Só se pode seguir CREATORs
      },
    });

    if (!targetCreator) {
      return new NextResponse(JSON.stringify({ error: "Criador não encontrado" }), {
        status: 404,
      });
    }

    const targetUserId = targetCreator.id;

    // Não se pode seguir a si mesmo
    if (followerId === targetUserId) {
      return new NextResponse(JSON.stringify({ error: "Não pode seguir a si mesmo" }), {
        status: 400,
      });
    }

    // 3. Verificar se já segue
    const existingFollow = await prisma.follows.findFirst({
      where: {
        followerId: followerId,
        followingId: targetUserId,
      },
      // [OPCIONAL, MAS BOM] Selecione apenas os campos que usamos
      select: {
        followerId: true,
        followingId: true,
      }
    });

    // 4. Se já segue, "unfollow"
    if (existingFollow) {
      
      // --- [ INÍCIO DA CORREÇÃO ] ---
      // Em vez de usar 'id', usamos o ID composto 'followerId_followingId'
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: followerId,
            followingId: targetUserId,
          }
        },
      });
      // --- [ FIM DA CORREÇÃO ] ---

      return NextResponse.json({ 
        message: "Deixou de seguir", 
        isFollowing: false 
      });
    }

    // 5. Se não segue, "follow"
    await prisma.follows.create({
      data: {
        followerId: followerId,
        followingId: targetUserId,
      },
    });

    return NextResponse.json({ 
      message: "Seguido com sucesso", 
      isFollowing: true 
    });

  } catch (error) {
    console.error("Erro ao seguir/deixar de seguir:", error);
    return new NextResponse(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
    });
  }
}