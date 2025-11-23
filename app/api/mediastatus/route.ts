import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { MediaType, MovieStatusType, Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache";

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
    
    const { 
      status, 
      title, 
      tmdbId,
      malId,
      igdbId,
      posterPath,
      mediaType,
      isWeekly 
    } = body;

    if (!title || !status || !mediaType) {
      return new NextResponse(JSON.stringify({ error: "Dados em falta (status, title, mediaType)" }), { status: 400 });
    }
    
    // Validação de ID obrigatório (exceto para 'OUTROS')
    if (mediaType !== 'OUTROS' && !tmdbId && !malId && !igdbId) {
        return new NextResponse(JSON.stringify({ error: "ID (tmdbId, malId ou igdbId) é obrigatório para este tipo" }), { status: 400 });
    }

    // Lógica para Encontrar ou Criar Mídia
    let media;
    let whereClause: any = { mediaType: mediaType };
    
    if (mediaType === 'ANIME' && malId) {
        whereClause.malId = Number(malId);
    } else if ((mediaType === 'MOVIE' || mediaType === 'SERIES') && tmdbId) {
        whereClause.tmdbId = Number(tmdbId);
    } else if (mediaType === 'GAME' && igdbId) {
        whereClause.igdbId = Number(igdbId);
    } else if (mediaType === 'OUTROS') {
        whereClause.title = title;
    }

    // Tenta encontrar
    media = await prisma.media.findFirst({
        where: whereClause,
    });

    // Se não existir, cria
    if (!media) {
      media = await prisma.media.create({
        data: {
          title,
          tmdbId: tmdbId ? Number(tmdbId) : null,
          malId: malId ? Number(malId) : null,
          igdbId: igdbId ? Number(igdbId) : null,
          posterPath: posterPath || "",
          mediaType: mediaType, 
        },
      });
    }
    
    // Upsert no Status (Salva na lista do usuário)
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

    // Limpa o cache do perfil público
    revalidateTag('user-profile');

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
    if (status) {
      updateData.status = status;
      if (status === 'WATCHED') {
        updateData.watchedAt = new Date();
      } else {
        updateData.watchedAt = null; 
      }
    }
    if (isWeekly !== undefined) updateData.isWeekly = isWeekly;

    const updatedMediaStatus = await prisma.mediaStatus.update({
      where: { id: id },
      data: updateData,
    });

    // Limpa o cache do perfil público
    revalidateTag('user-profile');

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
  const id = searchParams.get("id"); 

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
        // Apaga agendamentos pendentes para esta mídia
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

    // Limpa o cache do perfil público
    revalidateTag('user-profile');

    return new NextResponse(null, { status: 204 }); 
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return new NextResponse(JSON.stringify({ error: "Item não encontrado" }), { status: 404 });
    }
    console.error("[MEDIASTATUS_DELETE]", error);
    return new NextResponse(JSON.stringify({ error: "Erro Interno do Servidor" }), { status: 500 });
  }
}

// --- FUNÇÃO GET (Listar Itens com Correção de Órfãos) ---
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
    // 1. Buscamos TODOS os itens do status
    const allMediaStatus = await prisma.mediaStatus.findMany({
        where: {
            userId: userId,
            status: status,
        },
        include: {
            media: true, 
        },
    });

    // 2. Filtro Robusto (JavaScript)
    const filteredItems = allMediaStatus.filter(item => {
        // Segurança contra itens órfãos (sem mídia associada)
        if (!item.media || !item.media.title) {
            return false; 
        }
        // Filtro de busca textual
        if (searchTerm) {
            return item.media.title.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return true;
    });

    // 3. Ordenação Alfabética (JavaScript)
    filteredItems.sort((a, b) => {
        return (a.media.title || "").localeCompare(b.media.title || "");
    });

    // 4. Paginação Manual
    const totalCount = filteredItems.length;
    const skip = (page - 1) * pageSize;
    const paginatedItems = filteredItems.slice(skip, skip + pageSize);

    return NextResponse.json({
      items: paginatedItems,
      totalCount,
      page,
      pageSize,
    });
    
  } catch (error) {
    console.error("[MEDIASTATUS_GET]", error);
    return new NextResponse(JSON.stringify({ error: "Erro Interno do Servidor" }), { status: 500 });
  }
}