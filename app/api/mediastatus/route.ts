import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { revalidateTag, unstable_cache } from "next/cache";

export const runtime = 'nodejs';

// --- FUNÇÃO POST (Adicionar Item) ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
  const userId = session.user.id;

  try {
    const body = await request.json();
    const { status, title, tmdbId, malId, igdbId, posterPath, mediaType, isWeekly } = body;

    if (!title || !status || !mediaType) return new NextResponse(JSON.stringify({ error: "Dados em falta" }), { status: 400 });

    let whereClause: any = { mediaType };
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
      where: { userId_mediaId: { userId, mediaId: media.id } },
      update: {
        status,
        isWeekly: isWeekly || false,
        watchedAt: status === 'WATCHED' ? new Date() : null,
        updatedAt: new Date(),
      },
      create: {
        userId,
        mediaId: media.id,
        status,
        isWeekly: isWeekly || false,
        watchedAt: status === 'WATCHED' ? new Date() : null,
      },
    });

    // ⚡ SINCRONIZAÇÃO DE CACHE: Limpa a tag mestre que invalida todas as páginas de uma vez
    revalidateTag(`mediastatus-${userId}`);
    revalidateTag(`schedule`);
    if (session.user.username) {
        const userTag = session.user.username.toLowerCase();
        revalidateTag(`user-profile-${userTag}`);
        revalidateTag(`simple-schedule-${userTag}`);
    }

    return NextResponse.json(mediaStatus);
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Erro Interno" }), { status: 500 });
  }
}

// --- FUNÇÃO PUT (Atualizar Item) ---
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Não autorizado", { status: 401 });
  const userId = session.user.id;

  try {
    const { id, status, isWeekly } = await request.json();
    const updateData: any = { updatedAt: new Date() };
    if (status) {
      updateData.status = status;
      updateData.watchedAt = status === 'WATCHED' ? new Date() : null;
    }
    if (isWeekly !== undefined) updateData.isWeekly = isWeekly;

    const updated = await prisma.mediaStatus.update({
      where: { id, userId },
      data: updateData,
    });

    // ⚡ LIMPEZA DE CACHE
    revalidateTag(`mediastatus-${userId}`);
    if (session.user.username) {
        revalidateTag(`user-profile-${session.user.username.toLowerCase()}`);
    }

    return NextResponse.json(updated);
  } catch (error) {
    return new NextResponse("Erro Interno", { status: 500 });
  }
}

// --- FUNÇÃO DELETE (Remover Item) ---
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Não autorizado", { status: 401 });
  const userId = session.user.id;
  const id = new URL(request.url).searchParams.get("id");

  if (!id) return new NextResponse("ID faltando", { status: 400 });

  try {
    await prisma.mediaStatus.delete({ where: { id, userId } });

    // ⚡ LIMPEZA TOTAL
    revalidateTag(`mediastatus-${userId}`);
    revalidateTag(`schedule`);
    if (session.user.username) {
        revalidateTag(`user-profile-${session.user.username.toLowerCase()}`);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse("Erro Interno", { status: 500 });
  }
}

// --- FUNÇÃO GET OTIMIZADA ---
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  
  // Agora lemos o pageSize da URL (ou usamos 16 como padrão)
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "16"); 

  if (!status) return new NextResponse("Status required", { status: 400 });

  try {
    const getCachedList = unstable_cache(
      async () => {
        const where = { status: status as any };
        
        // Se pageSize for muito grande (ex: 2000), o Prisma busca tudo
        const [total, items] = await Promise.all([
           prisma.mediaStatus.count({ where }),
           prisma.mediaStatus.findMany({
             where,
             include: { media: true },
             skip: (page - 1) * pageSize, // Pula itens baseado no tamanho da página
             take: pageSize,              // Pega a quantidade solicitada
             orderBy: { updatedAt: 'desc' }
           })
        ]);
        return { total, items };
      },
      // ⚠️ IMPORTANTE: Adicione pageSize na chave do cache
      // Se não adicionar, ele pode te devolver a lista de 16 itens quando você pedir 1000
      [`list-${status}-${page}-${pageSize}`], 
      { revalidate: 3600, tags: ['mediastatus'] }
    );

    const data = await getCachedList();
    return NextResponse.json(data);
  } catch (error) {
    return new NextResponse("Erro", { status: 500 });
  }
}