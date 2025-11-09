// app/api/mediastatus/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { MediaStatus, MediaType, MovieStatusType } from "@prisma/client";

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
    
    // O frontend envia 'type' e 'posterUrl'
    const { 
      status, 
      title, 
      tmdbId, 
      posterUrl, // Recebemos 'posterUrl'
      type, 
      isWeekly 
    } = body;
    
    const mediaType: MediaType = type as MediaType; 

    if (tmdbId === undefined || !status || !title || !mediaType) {
      return new NextResponse(JSON.stringify({ error: "Dados em falta (id, status, title, type)" }), { status: 400 });
    }

    // 1. Encontrar ou Criar a 'Media' principal
    let media = await prisma.media.findFirst({
      where: {
        tmdbId: tmdbId,
        mediaType: mediaType,
      },
    });

    if (!media) {
      media = await prisma.media.create({
        data: {
          title,
          tmdbId,
          // --- [INÍCIO DA CORREÇÃO 1] ---
          // A API envia 'posterUrl', mas o schema.prisma espera 'posterPath'
          posterPath: posterUrl || "", // Corrigido de posterUrl para posterPath
          // --- [FIM DA CORREÇÃO 1] ---
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
    return new NextResponse("Erro Interno do Servidor", { status: 500 });
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
    const { id, status, isWeekly } = body; // 'id' aqui é o ID do MediaStatus

    if (!id) {
      return new NextResponse("ID do MediaStatus em falta", { status: 400 });
    }

    // Verifica se este status pertence ao utilizador logado
    const mediaStatusToUpdate = await prisma.mediaStatus.findUnique({
      where: { id: id },
    });

    if (!mediaStatusToUpdate || mediaStatusToUpdate.userId !== userId) {
      return new NextResponse("Não autorizado a atualizar este item", { status: 403 });
    }

    // Cria o objeto de atualização apenas com os campos fornecidos
    const updateData: any = {};
    if (status) updateData.status = status;
    if (isWeekly !== undefined) updateData.isWeekly = isWeekly;

    // --- [INÍCIO DA CORREÇÃO 2] ---
    // Estávamos a atualizar 'prisma.media' em vez de 'prisma.mediaStatus'
    const updatedMediaStatus = await prisma.mediaStatus.update({
      where: { id: id },
      data: updateData,
    });
    // --- [FIM DA CORREÇÃO 2] ---

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
    const mediaStatusToDelete = await prisma.mediaStatus.findUnique({
      where: { id: id },
    });

    if (!mediaStatusToDelete || mediaStatusToDelete.userId !== userId) {
      return new NextResponse("Não autorizado a apagar este item", { status: 403 });
    }

    await prisma.mediaStatus.delete({
      where: { id: id },
    });

    return new NextResponse(null, { status: 204 }); 
  } catch (error) {
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