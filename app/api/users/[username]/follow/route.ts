// app/api/users/[username]/follow/route.ts (Corrigido)

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

// Helper para encontrar utilizador (procura sempre em minúsculas)
async function findUserByUsername(username: string) {
  const lowerCaseUsername = decodeURIComponent(username).toLowerCase();
  return await prisma.user.findUnique({
    where: { username: lowerCaseUsername },
    select: { id: true }, // Apenas precisamos do ID para a lógica de 'follow'
  });
}

// GET (Verifica se está a seguir)
export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
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
  // @ts-ignore
  const loggedInUserId = session?.user?.id;

  if (!loggedInUserId) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const profileUser = await findUserByUsername(params.username);

  if (!profileUser) {
    return new NextResponse("Utilizador não encontrado", { status: 404 });
  }

  if (profileUser.id === loggedInUserId) {
    return new NextResponse("Não pode seguir-se a si mesmo", { status: 400 });
  }

  // Verifica se já segue
  const existingFollow = await prisma.follows.findUnique({
    where: {
      followerId_followingId: {
        followerId: loggedInUserId,
        followingId: profileUser.id,
      },
    },
  });

  if (existingFollow) {
    // --- [INÍCIO DA CORREÇÃO] ---
    // Deixar de Seguir
    // Devemos usar a chave composta 'followerId_followingId'
    await prisma.follows.delete({
      where: { 
        followerId_followingId: {
          followerId: loggedInUserId,
          followingId: profileUser.id,
        }
      },
    });
    // --- [FIM DA CORREÇÃO] ---
    return NextResponse.json({ message: "Deixou de seguir", isFollowing: false });
  } else {
    // Seguir
    await prisma.follows.create({
      data: {
        followerId: loggedInUserId,
        followingId: profileUser.id,
      },
    });
    return NextResponse.json({ message: "A seguir", isFollowing: true });
  }
}