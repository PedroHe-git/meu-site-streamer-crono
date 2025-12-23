import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { Prisma } from "@prisma/client";
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
        updatedAt: new Date(), // Força atualização da data para subir na lista
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
        revalidateTag(`user-profile-${session.user.username.toLowerCase()}`); 
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

    const updateData: any = { updatedAt: new Date() }; // Atualiza data para reordenar
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
    revalidateTag(`dashboard-schedule-${userId}`); 
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
  
  // Se não tiver sessão, nem tenta ir ao banco (Segurança + Economia)
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "50");
  const searchTerm = searchParams.get("searchTerm") || "";

  try {
    const userId = session.user.id;

    // ⚡ CACHE INTELIGENTE
    const getCachedMediaStatus = unstable_cache(
      async () => {
        const whereClause: any = {
          userId: userId,
        };

        if (status && status !== "ALL") {
          whereClause.status = status;
        }

        if (searchTerm) {
          whereClause.media = {
            title: {
              contains: searchTerm,
              mode: 'insensitive', // 👈 O culpado do ILIKE nos logs
            },
          };
        }

        const [items, total] = await Promise.all([
          prisma.mediaStatus.findMany({
            where: whereClause,
            include: { media: true },
            orderBy: { updatedAt: "desc" },
            take: pageSize,
            skip: (page - 1) * pageSize,
          }),
          prisma.mediaStatus.count({ where: whereClause }),
        ]);

        return { items, total, totalPages: Math.ceil(total / pageSize) };
      },
      // Chave única para cada combinação de busca
      [`mediastatus-${userId}-${status}-${page}-${searchTerm}`], 
      {
        revalidate: 3600, // 1 hora de cache (O banco dorme!)
        tags: [`mediastatus-${userId}`] // Tag para limpar cache ao editar
      }
    );

    const data = await getCachedMediaStatus();
    
    return NextResponse.json(data);

  } catch (error) {
    console.error("Erro ao buscar mediastatus:", error);
    return new NextResponse("Erro Interno", { status: 500 });
  }
}