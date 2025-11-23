// app/api/users/[username]/follow/route.ts (Corrigido)

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";

// Helper para encontrar utilizador (procura sempre em minúsculas)
async function findUserByUsername(username: string) {
  const lowerCaseUsername = decodeURIComponent(username).toLowerCase();
  return await prisma.user.findFirst({
    where: { username: lowerCaseUsername },
    select: { id: true, username: true }, // Apenas precisamos do ID para a lógica de 'follow'
  });
}

// GET (Verifica se está a seguir)
export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const session = await getServerSession(authOptions);
  
  const loggedInUserId = session?.user?.id;

  if (!loggedInUserId) {
    return NextResponse.json({ isFollowing: false });
  }

  const profileUser = await findUserByUsername(params.username);

  if (!profileUser) {
    return new NextResponse("Utilizador não encontrado", { status: 404 });
  }

  const follow = await prisma.follows.findUnique({
    where: {
      followerId_followingId: {
        followerId: loggedInUserId,
        followingId: profileUser.id,
      },
    },
  });

  return NextResponse.json({ isFollowing: !!follow });
}

// POST (Seguir ou Deixar de Seguir)
export async function POST(
  request: Request,
  { params }: { params: { username: string } }
) {
  const session = await getServerSession(authOptions);
  const loggedInUserId = session?.user?.id;

  if (!loggedInUserId) return new NextResponse("Não autorizado", { status: 401 });

  const profileUser = await findUserByUsername(params.username);
  if (!profileUser) return new NextResponse("Utilizador não encontrado", { status: 404 });

  if (profileUser.id === loggedInUserId) {
    return new NextResponse("Não pode seguir a si mesmo", { status: 400 });
  }

  const existingFollow = await prisma.follows.findUnique({
    where: {
      followerId_followingId: {
        followerId: loggedInUserId,
        followingId: profileUser.id,
      },
    },
  });

  let isFollowing = false;

  if (existingFollow) {
    await prisma.follows.delete({
      where: { 
        followerId_followingId: {
          followerId: loggedInUserId,
          followingId: profileUser.id,
        }
      },
    });
    isFollowing = false;
  } else {
    await prisma.follows.create({
      data: {
        followerId: loggedInUserId,
        followingId: profileUser.id,
      },
    });
    isFollowing = true;
  }

  // --- REVALIDAÇÃO INTELIGENTE ---
  
  // 1. Limpa o cache da LISTA de quem eu sigo (para o menu da sidebar atualizar)
  revalidateTag(`user-follows-${loggedInUserId}`);

  // 2. Limpa o cache do PERFIL PÚBLICO que acabei de seguir/deixar de seguir (para atualizar contador de seguidores)
  revalidateTag(`user-profile-${profileUser.username.toLowerCase()}`);
  
  // 3. Limpa o cache do MEU perfil público (para atualizar contador de "seguindo")
  if (session.user.username) {
      revalidateTag(`user-profile-${session.user.username.toLowerCase()}`);
  }

  return NextResponse.json({ message: isFollowing ? "A seguir" : "Deixou de seguir", isFollowing });
}