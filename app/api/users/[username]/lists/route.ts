// app/api/users/[username]/lists/route.ts (Atualizado)

import { NextResponse, NextRequest } from "next/server";
import prisma from '@/lib/prisma';
import { Prisma, ProfileVisibility } from "@prisma/client";
import { getServerSession } from "next-auth/next"; 
import { authOptions } from "@/lib/authOptions"; 

export const runtime = 'nodejs';
export const revalidate = 0; // Força esta API a ser dinâmica

// Define os tipos de status válidos
const validStatuses = ["TO_WATCH", "WATCHING", "WATCHED", "DROPPED"];
type StatusKey = "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED";

// GET /api/users/{username}/lists?status=TO_WATCH&page=1&pageSize=20&searchTerm=...
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const { username } = params;
  if (!username) {
    return new NextResponse(JSON.stringify({ error: "Username é obrigatório" }), { status: 400 });
  }

  try {
    // 1. Obter sessão do visitante
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const visitorId = session?.user?.id;

    // 2. Encontra o utilizador do perfil e as suas NOVAS flags de visibilidade
    const profileUser = await prisma.user.findUnique({
      where: { username: decodeURIComponent(username) },
      select: { 
        id: true, 
        profileVisibility: true,
        // --- [MUDANÇA AQUI] ---
        showToWatchList: true,
        showWatchingList: true,
        showWatchedList: true,
        showDroppedList: true
        // --- [FIM DA MUDANÇA] ---
      } 
    });

    if (!profileUser) {
      return new NextResponse(JSON.stringify({ error: "Utilizador não encontrado" }), { status: 404 });
    }

    // 3. Verificar Permissão de Visualização (Geral do Perfil)
    const isPublic = profileUser.profileVisibility === ProfileVisibility.PUBLIC;
    const isOwnProfile = visitorId === profileUser.id;
    let isFollowing = false;

    if (visitorId && !isOwnProfile) {
      const followRecord = await prisma.follows.findUnique({
        where: {
          followerId_followingId: {
            followerId: visitorId,
            followingId: profileUser.id,
          },
        },
      });
      isFollowing = !!followRecord;
    }

    const canViewProfile = isPublic || isOwnProfile || (visitorId && isFollowing);

    if (!canViewProfile) {
      return new NextResponse(JSON.stringify({ error: "Este perfil é privado." }), { status: 403 });
    }

    // 4. Se puder ver, continua...
    
    // Lê os parâmetros da URL
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    const statusParam = searchParams.get('status');
    const searchTerm = searchParams.get('searchTerm');

    // Valida o status
    if (!statusParam || !validStatuses.includes(statusParam)) {
       return new NextResponse(JSON.stringify({ error: "Status inválido ou não especificado" }), { status: 400 });
    }
    const statusFilter = statusParam as StatusKey;

    // Define paginação
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 20; 
    const skip = (page - 1) * pageSize;

    // --- [MUDANÇA AQUI: Aplicar Regra de Visibilidade da Lista] ---
    const listVisibilityMap = {
      TO_WATCH: profileUser.showToWatchList,
      WATCHING: profileUser.showWatchingList,
      WATCHED: profileUser.showWatchedList,
      DROPPED: profileUser.showDroppedList,
    };

    // Se a lista específica estiver oculta E o visitante não for o dono
    if (!listVisibilityMap[statusFilter] && !isOwnProfile) {
      // Retorna uma resposta vazia, como se a lista não tivesse itens.
      return NextResponse.json({
        items: [],
        totalCount: 0,
        page,
        pageSize
      });
    }
    // --- [FIM DA MUDANÇA] ---

    // Condição de busca (WHERE)
    const whereCondition: Prisma.MediaStatusWhereInput = {
      userId: profileUser.id,
      status: statusFilter,
    };
    if (searchTerm) {
      whereCondition.media = {
        title: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      };
    }

    // Busca Paginada e Contagem Total
    const [items, totalCount] = await Promise.all([
      prisma.mediaStatus.findMany({
        where: whereCondition,
        include: { media: true }, 
        skip: skip,
        take: pageSize,
        orderBy: { media: { title: 'asc' } }
      }),
      prisma.mediaStatus.count({
        where: whereCondition,
      })
    ]);

    return NextResponse.json({
      items,
      totalCount,
      page,
      pageSize
    });

  } catch (error) {
    console.error(`Erro ao buscar lista pública para ${username}:`, error);
    return new NextResponse(JSON.stringify({ error: "Erro interno do servidor" }), { status: 500 });
  }
}
