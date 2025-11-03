// app/api/users/[username]/lists/route.ts (Corrigido)

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

// --- [INÍCIO DA CORREÇÃO 1] ---
// Importar o 'prisma' do 'lib' e os Enums corretos
import prisma from "@/lib/prisma"; 
import { MovieStatusType, ProfileVisibility } from "@prisma/client"; // Nome correto é MovieStatusType
// --- [FIM DA CORREÇÃO 1] ---

export const runtime = 'nodejs';
export const revalidate = 0; 

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const loggedInUserId = session?.user?.id;
    const { username } = params;

    const url = new URL(request.url);
    
    // --- [INÍCIO DA CORREÇÃO 2] ---
    // O tipo correto é 'MovieStatusType' (o Enum)
    const status = url.searchParams.get("status") as MovieStatusType;
    // --- [FIM DA CORREÇÃO 2] ---
    
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = 10; 

    if (!status) {
      return new NextResponse("Status não fornecido", { status: 400 });
    }

    // 1. Encontrar o utilizador do perfil
    const profileUser = await prisma.user.findUnique({
      where: { username: decodeURIComponent(username).toLowerCase() },
      // Seleciona os campos necessários para a lógica de privacidade
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
      const follow = await prisma.follows.findUnique({
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

    // 3. Verificar a privacidade individual de cada lista (agora com 'isOwner')
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
    const whereClause = {
      userId: profileUser.id,
      status: status,
    };

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