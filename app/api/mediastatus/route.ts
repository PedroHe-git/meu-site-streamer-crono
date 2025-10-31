// app/api/mediastatus/route.ts (Atualizado)

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from '@/lib/prisma';
import { Prisma, MediaType } from "@prisma/client";

// --- [CONFIGURAÇÃO VERCEL] ---
export const runtime = 'nodejs';
export const region = 'gru1';
// --- [FIM DA CONFIGURAÇÃO] ---


// --- GET: (Permanece igual) ---
export async function GET(request: NextRequest) {
  // ... (O seu código GET completo)
  const session = await getServerSession(authOptions); 
  if (!session?.user?.email) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return new NextResponse("Usuário não encontrado", { status: 404 });
    }

    // Lê parâmetros da URL
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    const statusParam = searchParams.get('status');
    const searchTerm = searchParams.get('searchTerm');

    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 20; // Padrão
    const skip = (page - 1) * pageSize;

    // Valida o status
    let statusFilter: Prisma.EnumMovieStatusTypeFilter | undefined = undefined;
    if (statusParam && ["TO_WATCH", "WATCHING", "WATCHED", "DROPPED"].includes(statusParam)) {
        statusFilter = { equals: statusParam as Prisma.EnumMovieStatusTypeFilter['equals'] };
    } else {
        console.error("Erro na API GET mediastatus: Status inválido ou não especificado:", statusParam);
        return new NextResponse(JSON.stringify({ error: "Status inválido ou não especificado" }), { status: 400 });
    }

    // Condição de busca (WHERE)
    const whereCondition: Prisma.MediaStatusWhereInput = {
      userId: user.id,
      status: statusFilter,
    };
    if (searchTerm) {
      whereCondition.media = {
        title: {
          contains: searchTerm,
          mode: 'insensitive', // Ignora maiúsculas/minúsculas
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
        orderBy: { media: { title: 'asc' } } // Ordena pelo título da mídia
      }),
      prisma.mediaStatus.count({
        where: whereCondition,
      })
    ]);

    // Retorna os itens e a contagem total
    return NextResponse.json({
      items,
      totalCount,
      page,
      pageSize
    });

  } catch (error) {
    console.error("Erro ao buscar lista paginada (/api/mediastatus):", error);
    return new NextResponse(JSON.stringify({ error: "Erro interno ao buscar lista" }), { status: 500 });
  }
}

// --- POST: (Permanece igual) ---
export async function POST(request: Request) {
  // ... (O seu código POST completo)
  const session = await getServerSession(authOptions); 
  if (!session?.user?.email) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return new NextResponse("Usuário não encontrado", { status: 404 });
    }

    const body = await request.json();
    const {
      mediaId,      // Usado para atualizações rápidas
      mediaType,    // MOVIE, ANIME, SERIES, OUTROS
      tmdbId,
      malId,
      title,
      posterPath,
      releaseYear,
      status,
      isWeekly // Recebe o flag
    } = body;

    // Lógica de Atualização Rápida (se mediaId existir)
    if (mediaId) {
      const updatedStatus = await prisma.mediaStatus.update({
        where: {
          // Usa o índice único composto userId_mediaId
          userId_mediaId: { userId: user.id, mediaId: mediaId, },
        },
        data: {
          status: status, // Atualiza o status principal
          isWeekly: isWeekly !== undefined ? isWeekly : undefined,
        },
      });
      return NextResponse.json(updatedStatus);
    }

    // Lógica de Criação (se mediaId NÃO existir)
    const isManualAdd = !tmdbId && !malId;
    let finalTmdbId = tmdbId; let finalMalId = malId;
    
    // Cria um ID negativo único para itens manuais (incluindo "OUTROS")
    if (isManualAdd) {
        const fakeId = -Math.floor(Date.now() / 1000); // Timestamp negativo como ID
        
        // Se for MOVIE, SERIES, ou OUTROS, usamos o 'fakeId' no tmdbId
        if (mediaType === MediaType.MOVIE || mediaType === MediaType.SERIES || mediaType === MediaType.OUTROS) {
            finalTmdbId = fakeId;
        } 
        else if (mediaType === MediaType.ANIME) {
            finalMalId = fakeId;
        }
    }

    // Constrói a URL completa do poster
    let finalPosterPath = posterPath;
    if ((mediaType === MediaType.MOVIE || mediaType === MediaType.SERIES) && posterPath && !posterPath.startsWith('http')) {
        finalPosterPath = `https://image.tmdb.org/t/p/w500${posterPath}`;
    } else if (isManualAdd && posterPath && !posterPath.startsWith('https://i.imgur.com')) {
        return new NextResponse(JSON.stringify({ error: "URL inválida. Use 'Copiar Endereço da Imagem' no Imgur (i.imgur.com)." }), { status: 400 });
    }

    // Define condições para encontrar/criar a Mídia baseada no tipo
    let whereCondition: Prisma.MediaWhereUniqueInput;
    let createData: Prisma.MediaCreateInput;

    // Agrupa MOVIE, SERIES, e OUTROS, pois todos usam tmdbId como chave (real ou fake)
    if (mediaType === MediaType.MOVIE || mediaType === MediaType.SERIES || mediaType === MediaType.OUTROS) {
        whereCondition = { mediaType_tmdbId: { mediaType: mediaType, tmdbId: finalTmdbId }, };
        createData = { mediaType: mediaType, tmdbId: finalTmdbId, title: title, posterPath: finalPosterPath || "", releaseYear: releaseYear || null, };
    } 
    else if (mediaType === MediaType.ANIME) {
        whereCondition = { mediaType_malId: { mediaType: MediaType.ANIME, malId: finalMalId }, };
        createData = { mediaType: MediaType.ANIME, malId: finalMalId, title: title, posterPath: finalPosterPath || "", releaseYear: releaseYear || null, };
    } 
    else {
        return new NextResponse(JSON.stringify({ error: "MediaType inválido" }), { status: 400 });
    }

    // Usa upsert para criar a Mídia se não existir
    const media = await prisma.media.upsert({
      where: whereCondition,
      update: {}, // Não atualiza nada na Mídia se ela já existir
      create: createData,
    });

    // Usa upsert para criar/atualizar o MediaStatus
    const mediaStatus = await prisma.mediaStatus.upsert({
      where: { userId_mediaId: { userId: user.id, mediaId: media.id, }, },
      update: {
        status: status,
        isWeekly: isWeekly !== undefined ? isWeekly : undefined,
      },
      create: {
        userId: user.id,
        mediaId: media.id,
        status: status, 
        isWeekly: isWeekly ?? false,
        lastSeasonWatched: null,
        lastEpisodeWatched: null,
        lastEpisodeWatchedEnd: null,
      },
    });

    return NextResponse.json(mediaStatus);

  } catch (error) {
    console.error("Erro ao salvar status da media:", error);
    const errorMessage = (error instanceof Error) ? error.message : "Erro desconhecido";
    
    // Tratamento de erros
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
            const target = (error.meta?.target as string[])?.join(', ');
            return new NextResponse(JSON.stringify({ error: `Já existe um item com ${target ? `o mesmo ${target}` : 'dados únicos'}.` }), { status: 409 }); 
        }
    }
    // Erro de validação (como o que vimos, 'tmdbId' não pode ser null)
    if (error instanceof Prisma.PrismaClientValidationError) {
        return new NextResponse(JSON.stringify({ error: `Erro de validação: ${error.message}` }), { status: 400 });
    }

    return new NextResponse(JSON.stringify({ error: "Erro interno do servidor", details: errorMessage }), { status: 500 });
  }
}


// --- [NOVA FUNÇÃO DELETE AQUI] ---
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse("Usuário não encontrado", { status: 404 });
    }

    // Pega o ID do item a ser deletado pela URL (ex: /api/mediastatus?id=...)
    const { searchParams } = new URL(request.url);
    const mediaStatusId = searchParams.get('id');

    if (!mediaStatusId) {
      return new NextResponse(JSON.stringify({ error: "ID do item é obrigatório" }), { status: 400 });
    }

    // Deleta o item, garantindo que ele pertence ao usuário logado
    await prisma.mediaStatus.delete({
      where: {
        id: mediaStatusId,
        userId: user.id, // Segurança! Garante que o usuário só delete seus próprios itens.
      },
    });

    return NextResponse.json({ message: "Item removido com sucesso" }, { status: 200 });

  } catch (error) {
    console.error("Erro ao deletar item:", error);
    // Trata o caso do item não ser encontrado (ex: P2025 no Prisma)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
         return new NextResponse(JSON.stringify({ error: "Item não encontrado ou já removido" }), { status: 404 });
    }
    return new NextResponse(JSON.stringify({ error: "Erro interno ao deletar item" }), { status: 500 });
  }
}