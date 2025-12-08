import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { MovieStatusType, Prisma } from "@prisma/client";
import { revalidateTag, unstable_cache } from "next/cache";

export const runtime = 'nodejs';

// --- FUNÇÃO POST (Adicionar Item) ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
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
    
    if (mediaType !== 'OUTROS' && !tmdbId && !malId && !igdbId) {
        return new NextResponse(JSON.stringify({ error: "ID é obrigatório para este tipo" }), { status: 400 });
    }

    // Lógica para Encontrar ou Criar Mídia
    let whereClause: any = { mediaType: mediaType };
    
    if (mediaType === 'ANIME' && malId) whereClause.malId = Number(malId);
    else if ((mediaType === 'MOVIE' || mediaType === 'SERIES') && tmdbId) whereClause.tmdbId = Number(tmdbId);
    else if (mediaType === 'GAME' && igdbId) whereClause.igdbId = Number(igdbId);
    else if (mediaType === 'OUTROS') whereClause.title = title;

    let media = await prisma.media.findFirst({ where: whereClause });

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

    // INVALIDAÇÃO DE CACHE
    revalidateTag(`dashboard-lists-${userId}`); // Limpa lista do painel
    revalidateTag(`user-stats-${userId}`);      // Limpa estatísticas
    if (session.user.username) {
        revalidateTag(`user-profile-${session.user.username.toLowerCase()}`); // Limpa perfil público
    }

    return NextResponse.json(mediaStatus);
  } catch (error) {
    console.error("[MEDIASTATUS_POST]", error);
    return new NextResponse(JSON.stringify({ error: "Erro Interno" }), { status: 500 });
  }
}

// --- FUNÇÃO PUT (Atualizar Item) ---
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
  }
  
  const userId = session.user.id;

  try {
    const body = await request.json();
    const { id, status, isWeekly } = body; 

    if (!id) {
      return new NextResponse(JSON.stringify({ error: "ID faltando" }), { status: 400 });
    }

    const currentItem = await prisma.mediaStatus.findUnique({
        where: { id },
        select: { userId: true }
    });

    if (!currentItem || currentItem.userId !== userId) {
        return new NextResponse("Não autorizado", { status: 403 });
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      updateData.watchedAt = status === 'WATCHED' ? new Date() : null;
    }
    if (isWeekly !== undefined) updateData.isWeekly = isWeekly;

    const updatedMediaStatus = await prisma.mediaStatus.update({
      where: { id: id },
      data: updateData,
    });

    // INVALIDAÇÃO DE CACHE
    revalidateTag(`dashboard-lists-${userId}`);
    revalidateTag(`user-stats-${userId}`);
    if (session.user.username) {
        revalidateTag(`user-profile-${session.user.username.toLowerCase()}`);
    }

    return NextResponse.json(updatedMediaStatus);
  } catch (error) {
    console.error("[MEDIASTATUS_PUT]", error);
    return new NextResponse(JSON.stringify({ error: "Erro Interno" }), { status: 500 });
  }
}

// --- FUNÇÃO DELETE (Remover Item) ---
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
  }
  
  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id"); 

  if (!id) return new NextResponse("ID faltando", { status: 400 });

  try {
    const mediaStatus = await prisma.mediaStatus.findUnique({
        where: { id: id, userId: userId },
        select: { mediaId: true }
    });

    if (mediaStatus) {
        await prisma.scheduleItem.deleteMany({
            where: {
                userId: userId,
                mediaId: mediaStatus.mediaId,
                isCompleted: false 
            }
        });
    }

    await prisma.mediaStatus.delete({
      where: { id: id, userId: userId }, 
    });

    // INVALIDAÇÃO DE CACHE
    revalidateTag(`dashboard-lists-${userId}`);
    revalidateTag(`user-stats-${userId}`);
    revalidateTag(`dashboard-schedule-${userId}`); // Remove também da agenda
    if (session.user.username) {
        revalidateTag(`user-profile-${session.user.username.toLowerCase()}`);
    }

    return new NextResponse(null, { status: 204 }); 
  } catch (error) {
    console.error("[MEDIASTATUS_DELETE]", error);
    return new NextResponse(JSON.stringify({ error: "Erro Interno" }), { status: 500 });
  }
}

// --- FUNÇÃO GET OTIMIZADA (Com Cache e Paginação no Banco) ---
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
  }
  
  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  
  const status = searchParams.get("status") as MovieStatusType;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);
  const searchTerm = searchParams.get("searchTerm") || "";

  if (!status) return new NextResponse("Status não fornecido", { status: 400 });

  try {
    // Chave única para o cache baseada nos filtros
    const cacheKey = `list-${userId}-${status}-${page}-${pageSize}-${searchTerm}`;

    const getCachedList = unstable_cache(
      async () => {
        // Filtro direto no banco de dados
        const whereClause: Prisma.MediaStatusWhereInput = {
            userId: userId,
            status: status,
            media: {
                title: searchTerm ? { contains: searchTerm, mode: 'insensitive' } : undefined
            }
        };

        const [totalCount, items] = await Promise.all([
            prisma.mediaStatus.count({ where: whereClause }),
            prisma.mediaStatus.findMany({
                where: whereClause,
                take: pageSize,
                skip: (page - 1) * pageSize,
                include: { media: true },
                orderBy: { media: { title: 'asc' } }
            })
        ]);

        return { items, totalCount, page, pageSize };
      },
      [cacheKey], 
      {
        revalidate: 3600, // Cache de 1 hora
        tags: [`dashboard-lists-${userId}`] // Tag para invalidação
      }
    );

    const data = await getCachedList();

    return NextResponse.json(data);
    
  } catch (error) {
    console.error("[MEDIASTATUS_GET]", error);
    return new NextResponse(JSON.stringify({ error: "Erro Interno" }), { status: 500 });
  }
}