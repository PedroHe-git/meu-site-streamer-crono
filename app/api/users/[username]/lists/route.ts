// app/api/users/[username]/lists/route.ts (Corrigido)

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma"; 
import { MovieStatusType, ProfileVisibility, Prisma } from "@prisma/client"; // Importa Prisma para tipos

export const runtime = 'nodejs';
export const revalidate = 0; 

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    const loggedInUserId = session?.user?.id;
    const { username } = params;

    const url = new URL(request.url);
    
    const status = url.searchParams.get("status") as MovieStatusType;
    
    // --- [INÍCIO DA CORREÇÃO 1] ---
    // Ler o searchTerm e o pageSize da URL (o seu ficheiro antigo não fazia isto)
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10", 10); // O PaginatedList envia 10
    const searchTerm = url.searchParams.get("searchTerm") || ""; // Ler o searchTerm
    // --- [FIM DA CORREÇÃO 1] ---

    if (!status) {
      return new NextResponse("Status não fornecido", { status: 400 });
    }

    // 1. Encontrar o utilizador do perfil (Corrigido para usar findFirst com insensitive mode)
    const profileUser = await prisma.user.findFirst({
      where: { username: { equals: decodeURIComponent(username), mode: 'insensitive' } },
      select: {
        id: true,
        profileVisibility: true,
        showToWatchList: true,
        showWatchingList: true,
        showWatchedList: true,
        showDroppedList: true,
      }
    });

    if (!profileUser) {
      return new NextResponse("Utilizador não encontrado", { status: 404 });
    }

    // 2. Verificar a privacidade do perfil
    let isFollowing = false;
    if (loggedInUserId && loggedInUserId !== profileUser.id) {
      const follow = await prisma.follows.findUnique({ // Corrigido para 'follows'
        where: {
          followerId_followingId: {
            followerId: loggedInUserId,
            followingId: profileUser.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    const isOwner = loggedInUserId === profileUser.id;
    const isPrivateAndNotFollowed =
      profileUser.profileVisibility === ProfileVisibility.FOLLOWERS_ONLY &&
      !isFollowing &&
      !isOwner; 

    if (isPrivateAndNotFollowed) {
      return NextResponse.json({ items: [], totalCount: 0, page: 1, pageSize });
    }

    // 3. Verificar a privacidade individual de cada lista
    if (status === "TO_WATCH" && !profileUser.showToWatchList && !isOwner) {
      return NextResponse.json({ items: [], totalCount: 0, page: 1, pageSize });
    }
    if (status === "WATCHING" && !profileUser.showWatchingList && !isOwner) {
      return NextResponse.json({ items: [], totalCount: 0, page: 1, pageSize });
    }
    if (status === "WATCHED" && !profileUser.showWatchedList && !isOwner) {
      return NextResponse.json({ items: [], totalCount: 0, page: 1, pageSize });
    }
    if (status === "DROPPED" && !profileUser.showDroppedList && !isOwner) {
      return NextResponse.json({ items: [], totalCount: 0, page: 1, pageSize });
    }

    // 4. Se passou em todas as verificações, busca os dados
    
    // --- [INÍCIO DA CORREÇÃO 2] ---
    // Adicionar o filtro de 'searchTerm' ao whereClause
    const whereClause: Prisma.MediaStatusWhereInput = { // Tipo explícito
      userId: profileUser.id,
      status: status,
      media: { // Filtra na tabela 'Media' relacionada
        title: {
          contains: searchTerm,
          mode: 'insensitive', // Ignora maiúsculas/minúsculas
        },
      },
    };
    // --- [FIM DA CORREÇÃO 2] ---

    const totalCount = await prisma.mediaStatus.count({ where: whereClause });
    const mediaStatus = await prisma.mediaStatus.findMany({
      where: whereClause,
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: {
        media: true, 
      },
      orderBy: { 
        media: {
          title: 'asc'
        }
      },
    });

    return NextResponse.json({
      items: mediaStatus,
      totalCount,
      page,
      pageSize,
    });
  } catch (error) {
    console.error(`[USERS_LISTS_GET_${params.username}]`, error);
    return new NextResponse(JSON.stringify({ error: "Erro Interno" }), { status: 500 });
  }
}