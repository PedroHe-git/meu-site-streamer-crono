import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache"; // Importar revalidateTag

async function findUserByUsername(username: string) {
  const lowerCaseUsername = decodeURIComponent(username).toLowerCase();
  return await prisma.user.findUnique({
    where: { username: lowerCaseUsername },
    select: { id: true, username: true },
  });
}

// GET: Verifica se segue (Mantém sem cache ou com cache curto se preferir, mas GET direto é ok aqui se for pouco usado)
export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const session = await getServerSession(authOptions);
  const loggedInUserId = session?.user?.id;

  if (!loggedInUserId) return NextResponse.json({ isFollowing: false });

  const profileUser = await findUserByUsername(params.username);
  if (!profileUser) return new NextResponse("Utilizador não encontrado", { status: 404 });

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

// POST: Seguir / Deixar de Seguir
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
    return new NextResponse("Não pode seguir-se a si mesmo", { status: 400 });
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

  // --- REVALIDAÇÃO DE CACHE ---
  
  // 1. Limpa a lista de "Quem eu sigo" do usuário logado (para a Sidebar atualizar)
  revalidateTag(`user-follows-${loggedInUserId}`);

  // 2. Limpa o perfil público de quem foi seguido (para atualizar o contador de seguidores)
  revalidateTag(`user-profile-${profileUser.username.toLowerCase()}`);

  // 3. Limpa o perfil público do usuário logado (para atualizar o contador de "seguindo")
  if (session.user.username) {
      revalidateTag(`user-profile-${session.user.username.toLowerCase()}`);
  }

  return NextResponse.json({ message: isFollowing ? "A seguir" : "Deixou de seguir", isFollowing });
}