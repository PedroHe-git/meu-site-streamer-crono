// app/api/mediastatus/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { MediaStatus, MediaType, MovieStatusType, Prisma } from "@prisma/client";

export const runtime = 'nodejs';
export const revalidate = 0; 

// --- FUNÇÃO POST (Adicionar Item) ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Não autorizado", { status: 401 });
  }
  // @ts-ignore
  const userId = session.user.id;

  try {
    const body = await request.json();
    
    // --- [INÍCIO DA CORREÇÃO 1] ---
    // Lê os campos corretos enviados pelo MediaSearch.tsx
    const { 
      status, 
      title, 
      tmdbId,     // Pode ser null
      malId,      // Pode ser null
      posterPath, // Corrigido de posterUrl
      mediaType,  // Corrigido de type
      isWeekly 
    } = body;
    // --- [FIM DA CORREÇÃO 1] ---

    if (!title || !status || !mediaType) {
      return new NextResponse(JSON.stringify({ error: "Dados em falta (status, title, mediaType)" }), { status: 400 });
    }
    
    // Validação de ID: Se não for 'OUTROS', precisa de um ID
    if (mediaType !== 'OUTROS' && !tmdbId && !malId) {
        return new NextResponse(JSON.stringify({ error: "ID (tmdbId ou malId) é obrigatório para este tipo" }), { status: 400 });
    }

    // 1. Encontrar ou Criar a 'Media' principal
    let media;
    
    // --- [INÍCIO DA CORREÇÃO 2] ---
    // Lógica de busca correta baseada no tipo
    let whereClause: Prisma.MediaWhereInput = { mediaType: mediaType };
    
    // Define a condição de ID apenas se o ID for fornecido
    if (mediaType === 'ANIME' && malId) {
        whereClause.malId = Number(malId);
    } else if ((mediaType === 'MOVIE' || mediaType === 'SERIES') && tmdbId) {
        whereClause.tmdbId = Number(tmdbId);
    } else if (mediaType === 'OUTROS') {
        // Itens manuais 'OUTROS' são únicos pelo título
        whereClause.title = title;
    }

    // Procura a mídia se tiver uma condição de ID ou for 'OUTROS'
    if ((mediaType !== 'OUTROS' && (tmdbId || malId)) || mediaType === 'OUTROS') {
        media = await prisma.media.findFirst({
            where: whereClause,
        });
    }
    // --- [FIM DA CORREÇÃO 2] ---

    if (!media) {
      media = await prisma.media.create({
        data: {
          title,
          tmdbId: tmdbId ? Number(tmdbId) : null,
          malId: malId ? Number(malId) : null,
          posterPath: posterPath || "",
          mediaType: mediaType, 
        },
      });
    }

    // 2. Criar ou Atualizar (Upsert) o 'MediaStatus' para este utilizador
    const mediaStatus = await prisma.mediaStatus.upsert({
      where: {
        userId_mediaId: {
          userId: userId,
          mediaId: media.id,
        },
      },
      update: {
        status: status,
        isWeekly: isWeekly || false,
      },
      create: {
        userId: userId,
        mediaId: media.id,
        status: status,
        isWeekly: isWeekly || false,
      },
      include: {
        media: true,
      },
    });

    return NextResponse.json(mediaStatus);
  } catch (error) {
    console.error("[MEDIASTATUS_POST]", error);
    return new NextResponse(JSON.stringify({ error: "Erro Interno do Servidor" }), { status: 500 });
  }
}

// --- FUNÇÃO PUT (Mover Item / Atualizar) ---
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Não autorizado", { status: 401 });
  }
  // @ts-ignore
  const userId = session.user.id;

  try {
    const body = await request.json();
    // 'id' aqui é o ID do MediaStatus
    const { id, status, isWeekly } = body; 

    if (!id) {
      return new NextResponse("ID do MediaStatus em falta", { status: 400 });
    }

    const mediaStatusToUpdate = await prisma.mediaStatus.findUnique({
      where: { id: id },
    });

    if (!mediaStatusToUpdate || mediaStatusToUpdate.userId !== userId) {
      return new NextResponse("Não autorizado a atualizar este item", { status: 403 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (isWeekly !== undefined) updateData.isWeekly = isWeekly;

    const updatedMediaStatus = await prisma.mediaStatus.update({
      where: { id: id },
      data: updateData,
    });

    return NextResponse.json(updatedMediaStatus);
  } catch (error) {
    console.error("[MEDIASTATUS_PUT]", error);
    return new NextResponse("Erro Interno do Servidor", { status: 500 });
  }
}

// --- FUNÇÃO DELETE (Remover Item) ---
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Não autorizado", { status: 401 });
  }
  // @ts-ignore
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id"); // Espera o ID do MediaStatus na URL

  if (!id) {
    return new NextResponse("ID do MediaStatus em falta na URL", { status: 400 });
  }

  try {
    
    // --- [INÍCIO DA CORREÇÃO (Prevenção de Órfãos)] ---
    const mediaStatus = await prisma.mediaStatus.findUnique({
        where: { 
            id: id, 
            userId: userId 
        },
        select: { mediaId: true }
    });

    if (mediaStatus) {
        // Apaga agendamentos pendentes para esta média
        await prisma.scheduleItem.deleteMany({
            where: {
                userId: userId,
                mediaId: mediaStatus.mediaId,
                isCompleted: false 
            }
        });
    }
    // --- [FIM DA CORREÇÃO] ---

    // Agora apaga o MediaStatus
    await prisma.mediaStatus.delete({
      where: { id: id, userId: userId }, // Garante que só apaga se for o dono
    });

    return new NextResponse(null, { status: 204 }); 
  } catch (error) {
    // Trata caso o item já tenha sido apagado ou não exista
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return new NextResponse(JSON.stringify({ error: "Item não encontrado" }), { status: 404 });
    }
    console.error("[MEDIASTATUS_DELETE]", error);
    return new NextResponse("Erro Interno do Servidor", { status: 500 });
  }
}

// --- FUNÇÃO GET (Listar Itens) ---
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Não autorizado", { status: 401 });
  }
  // @ts-ignore
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as MovieStatusType;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "500", 10);
  const searchTerm = searchParams.get("searchTerm") || "";

  if (!status) {
    return new NextResponse("Status não fornecido", { status: 400 });
  }

  const whereClause: any = {
    userId: userId,
    status: status,
    media: {
      title: {
        contains: searchTerm,
        mode: "insensitive",
      },
    },
  };

  try {
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
    console.error("[MEDIASTATUS_GET]", error);
    return new NextResponse("Erro Interno do Servidor", { status: 500 });
  }
}