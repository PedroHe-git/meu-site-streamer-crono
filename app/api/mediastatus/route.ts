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
  
  if (!session || !session.user || !session.user.id) {
    return new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
  }
  
  const userId = session.user.id;

  try {
    const body = await request.json();
    
    // 1. Receber igdbId no destructuring
    const { 
      status, 
      title, 
      tmdbId,
      malId,
      igdbId, // <--- NOVO
      posterPath,
      mediaType,
      isWeekly 
    } = body;

    if (!title || !status || !mediaType) {
      return new NextResponse(JSON.stringify({ error: "Dados em falta (status, title, mediaType)" }), { status: 400 });
    }
    
    // 2. Atualizar validação de ID obrigatório
    if (mediaType !== 'OUTROS' && !tmdbId && !malId && !igdbId) {
        return new NextResponse(JSON.stringify({ error: "ID (tmdbId, malId ou igdbId) é obrigatório para este tipo" }), { status: 400 });
    }

    // 3. Lógica para Encontrar Mídia
    let media;
    let whereClause: any = { mediaType: mediaType }; // 'any' facilita a tipagem dinâmica do Prisma aqui
    
    if (mediaType === 'ANIME' && malId) {
        whereClause.malId = Number(malId);
    } else if ((mediaType === 'MOVIE' || mediaType === 'SERIES') && tmdbId) {
        whereClause.tmdbId = Number(tmdbId);
    } else if (mediaType === 'GAME' && igdbId) { // <--- NOVO BLOCO
        whereClause.igdbId = Number(igdbId);
    } else if (mediaType === 'OUTROS') {
        whereClause.title = title;
    }

    // Tenta encontrar
    if (mediaType !== 'OUTROS' || mediaType === 'OUTROS') {
        media = await prisma.media.findFirst({
            where: whereClause,
        });
    }

    // 4. Lógica para Criar Mídia se não existir
    if (!media) {
      media = await prisma.media.create({
        data: {
          title,
          tmdbId: tmdbId ? Number(tmdbId) : null,
          malId: malId ? Number(malId) : null,
          igdbId: igdbId ? Number(igdbId) : null, // <--- NOVO CAMPO
          posterPath: posterPath || "",
          mediaType: mediaType, 
        },
      });
    }

    // O restante (upsert do MediaStatus) continua igual
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
        watchedAt: status === 'WATCHED' ? new Date() : null,
      },
      create: {
        userId: userId,
        mediaId: media.id,
        status: status,
        isWeekly: isWeekly || false,
        watchedAt: status === 'WATCHED' ? new Date() : null,
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
  
  if (!session || !session.user || !session.user.id) {
    return new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
  }
  
  const userId = session.user.id;

  try {
    const body = await request.json();
    const { id, status, isWeekly } = body; // 'id' aqui é o ID do MediaStatus

    if (!id) {
      return new NextResponse(JSON.stringify({ error: "ID do MediaStatus em falta" }), { status: 400 });
    }

    const mediaStatusToUpdate = await prisma.mediaStatus.findUnique({
      where: { id: id },
    });

    if (!mediaStatusToUpdate || mediaStatusToUpdate.userId !== userId) {
      return new NextResponse(JSON.stringify({ error: "Não autorizado a atualizar este item" }), { status: 403 });
    }

    const updateData: any = {};
    if (status) {updateData.status = status;
      if (status === 'WATCHED') {
        updateData.watchedAt = new Date();
      } else {
        updateData.watchedAt = null; // Remove o timestamp se mover para "Abandonado"
      }
    }
    if (isWeekly !== undefined) updateData.isWeekly = isWeekly;

    const updatedMediaStatus = await prisma.mediaStatus.update({
      where: { id: id },
      data: updateData,
    });

    return NextResponse.json(updatedMediaStatus);
  } catch (error) {
    console.error("[MEDIASTATUS_PUT]", error);
    return new NextResponse(JSON.stringify({ error: "Erro Interno do Servidor" }), { status: 500 });
  }
}

// --- FUNÇÃO DELETE (Remover Item) ---
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.id) {
    return new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
  }
  
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id"); // Espera o ID do MediaStatus na URL

  if (!id) {
    return new NextResponse(JSON.stringify({ error: "ID do MediaStatus em falta na URL" }), { status: 400 });
  }

  try {
    
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

    // Agora apaga o MediaStatus
    await prisma.mediaStatus.delete({
      where: { id: id, userId: userId }, 
    });

    return new NextResponse(null, { status: 204 }); 
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return new NextResponse(JSON.stringify({ error: "Item não encontrado" }), { status: 404 });
    }
    console.error("[MEDIASTATUS_DELETE]", error);
    return new NextResponse(JSON.stringify({ error: "Erro Interno do Servidor" }), { status: 500 });
  }
}

// --- FUNÇÃO GET (Listar Itens) ---
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.id) {
    return new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
  }
  
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as MovieStatusType;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "500", 10);
  const searchTerm = searchParams.get("searchTerm") || "";

  if (!status) {
    return new NextResponse(JSON.stringify({ error: "Status não fornecido" }), { status: 400 });
  }

  try {
    // --- [INÍCIO DA CORREÇÃO] ---
    // 1. Buscamos TODOS os status primeiro, sem filtro ou ordenação de 'media'
    const allMediaStatus = await prisma.mediaStatus.findMany({
        where: {
            userId: userId,
            status: status,
        },
        include: {
            media: true, // Inclui a mídia
        },
    });

    // 2. Filtramos em JavaScript (muito mais seguro contra dados nulos/órfãos)
    const filteredItems = allMediaStatus.filter(item => {
        // Se 'media' for nulo (órfão) ou o título não bater, remove
        if (!item.media || !item.media.title) {
            console.warn(`[DATA_CLEANUP] Item órfão encontrado: MediaStatus ID ${item.id} (Media ID ${item.mediaId})`);
            return false; // Remove órfãos
        }
        if (searchTerm) {
            return item.media.title.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return true; // Mantém se não houver searchTerm
    });

    // 3. Ordenamos em JavaScript (mais seguro)
    filteredItems.sort((a, b) => {
        // 'a.media.title' está seguro aqui por causa do filtro acima
        return (a.media.title || "").localeCompare(b.media.title || "");
    });

    // 4. Paginação manual
    const totalCount = filteredItems.length;
    const skip = (page - 1) * pageSize;
    const paginatedItems = filteredItems.slice(skip, skip + pageSize);
    // --- [FIM DA CORREÇÃO] ---

    return NextResponse.json({
      items: paginatedItems, // Retorna os itens paginados
      totalCount,
      page,
      pageSize,
    });
    
  } catch (error) {
    console.error("[MEDIASTATUS_GET]", error);
    return new NextResponse(JSON.stringify({ error: "Erro Interno do Servidor" }), { status: 500 });
  }
}