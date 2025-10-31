import { NextResponse, NextRequest } from "next/server";
// --- [IMPORTANTE] Usa imports do Next-Auth v4 ---
import { getServerSession } from "next-auth/next";
// --- [IMPORT CORRETO V4] ---
// Importa do ficheiro da API route do NextAuth
import { authOptions } from "@/lib/authOptions";
// --- [FIM IMPORT] ---
import prisma from '@/lib/prisma';
import { Prisma, MediaType } from "@prisma/client";

export const runtime = 'nodejs';
export const region = 'gru1';


  // --- GET: Busca listas paginadas e filtradas ---
  export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions); // Usa authOptions v4 importado corretamente
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
        // Retorna erro se o status for inválido ou ausente
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

  // --- POST: Adiciona/Atualiza Status (com isWeekly) ---
  export async function POST(request: Request) {
    const session = await getServerSession(authOptions); // Usa authOptions v4 importado corretamente
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
        mediaId,    // Usado para atualizações rápidas
        mediaType,
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
            // Atualiza isWeekly apenas se o valor for enviado (true ou false)
            // Se for undefined (não enviado), mantém o valor existente no BD
            isWeekly: isWeekly !== undefined ? isWeekly : undefined,
          },
        });
        return NextResponse.json(updatedStatus);
      }

      // Lógica de Criação (se mediaId NÃO existir)
      const isManualAdd = !tmdbId && !malId;
      let finalTmdbId = tmdbId; let finalMalId = malId;
      // Cria um ID negativo único para itens manuais para evitar conflito de constraint
      if (isManualAdd) {
        const fakeId = -Math.floor(Date.now() / 1000); // Timestamp negativo como ID
        if (mediaType === MediaType.MOVIE || mediaType === MediaType.SERIES) finalTmdbId = fakeId;
        else if (mediaType === MediaType.ANIME) finalMalId = fakeId;
      }

      // Constrói a URL completa do poster para TMDB ou valida Imgur para manual
      let finalPosterPath = posterPath;
      if ((mediaType === MediaType.MOVIE || mediaType === MediaType.SERIES) && posterPath && !posterPath.startsWith('http')) {
        finalPosterPath = `https://image.tmdb.org/t/p/w500${posterPath}`;
      } else if (isManualAdd && posterPath && !posterPath.startsWith('https://i.imgur.com')) {
        // Validação adicionada para garantir que posters manuais venham do Imgur
        return new NextResponse(JSON.stringify({ error: "URL inválida. Use 'Copiar Endereço da Imagem' no Imgur (i.imgur.com)." }), { status: 400 });
      }

      // Define condições para encontrar/criar a Mídia baseada no tipo
      let whereCondition: Prisma.MediaWhereUniqueInput;
      let createData: Prisma.MediaCreateInput;

      if (mediaType === MediaType.MOVIE || mediaType === MediaType.SERIES) {
        whereCondition = { mediaType_tmdbId: { mediaType: mediaType, tmdbId: finalTmdbId }, };
        createData = { mediaType: mediaType, tmdbId: finalTmdbId, title: title, posterPath: finalPosterPath || "", releaseYear: releaseYear || null, };
      } else if (mediaType === MediaType.ANIME) {
        whereCondition = { mediaType_malId: { mediaType: MediaType.ANIME, malId: finalMalId }, };
        createData = { mediaType: MediaType.ANIME, malId: finalMalId, title: title, posterPath: finalPosterPath || "", releaseYear: releaseYear || null, };
      } else {
        // Se mediaType não for reconhecido
        return new NextResponse(JSON.stringify({ error: "MediaType inválido" }), { status: 400 });
      }

      // Usa upsert para criar a Mídia se não existir, ou apenas encontrá-la se já existir
      const media = await prisma.media.upsert({
        where: whereCondition,
        update: {}, // Não atualiza nada na Mídia se ela já existir
        create: createData, // Cria com os dados fornecidos se não existir
      });

      // Usa upsert para criar o MediaStatus se for a primeira vez que o user adiciona esta Mídia,
      // ou atualiza o 'status' e 'isWeekly' se já existir uma entrada para este user/mídia.
      const mediaStatus = await prisma.mediaStatus.upsert({
        where: { userId_mediaId: { userId: user.id, mediaId: media.id, }, },
        update: {
          status: status, // Atualiza o status
          isWeekly: isWeekly !== undefined ? isWeekly : undefined, // Atualiza isWeekly se vier
        },
        create: {
          userId: user.id,
          mediaId: media.id,
          status: status, // Define o status inicial
          isWeekly: isWeekly ?? false, // Define isWeekly ao criar (false por defeito se não vier)
          // Garante que campos de progresso começam nulos ao criar
          lastSeasonWatched: null,
          lastEpisodeWatched: null,
          lastEpisodeWatchedEnd: null,
        },
      });

      // Retorna o MediaStatus criado ou atualizado
      return NextResponse.json(mediaStatus);

    } catch (error) {
      console.error("Erro ao salvar status da media:", error);
      const errorMessage = (error instanceof Error) ? error.message : "Erro desconhecido";
      // Tratamento específico para erro de constraint única (P2002)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = (error.meta?.target as string[])?.join(', '); // Tenta obter o campo que falhou
          return new NextResponse(JSON.stringify({ error: `Já existe um item com ${target ? `o mesmo ${target}` : 'dados únicos'}.` }), { status: 409 }); // 409 Conflict
        }
      }
      // Erro genérico
      return new NextResponse(JSON.stringify({ error: "Erro interno do servidor", details: errorMessage }), { status: 500 });
    }
  }

