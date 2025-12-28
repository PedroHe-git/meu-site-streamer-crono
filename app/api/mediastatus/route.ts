import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { revalidateTag, unstable_cache } from "next/cache";

export const runtime = 'nodejs';

// --- GET OTIMIZADO ---
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const userId = session.user.id;
  
  const status = searchParams.get("status") || "ALL";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "16");
  const searchTerm = searchParams.get("searchTerm") || ""; 

  try {
    const getCachedMediaStatus = unstable_cache(
      async (uId, s, p, ps, st) => {
        let whereClause: any = { userId: uId };
        
        // 🔥 LÓGICA HÍBRIDA RESTAURADA
        if (s === "WATCHED") {
            whereClause.OR = [
                { status: 'WATCHED' },
                { status: 'WATCHING', lastSeasonWatched: { gt: 0 } }
            ];
        } else if (s !== "ALL") {
            whereClause.status = s;
        }

        if (st) {
          const searchFilter = { media: { title: { contains: st, mode: 'insensitive' } } };
          if (whereClause.OR) {
              whereClause.AND = [ searchFilter, { OR: whereClause.OR } ];
              delete whereClause.OR;
          } else {
              whereClause.media = searchFilter.media;
          }
        }

        const [items, total] = await Promise.all([
          prisma.mediaStatus.findMany({
            where: whereClause,
            include: { media: true },
            orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
            take: ps,
            skip: (p - 1) * ps,
          }),
          prisma.mediaStatus.count({ where: whereClause }),
        ]);

        return { items, total, totalPages: Math.ceil(total / ps) };
      },
      [`mediastatus-${userId}-${status}-${page}-${pageSize}-${searchTerm}`], 
      { revalidate: 3600, tags: [`mediastatus-${userId}`] }
    );

    const data = await getCachedMediaStatus(userId, status, page, pageSize, searchTerm);
    return NextResponse.json(data);
  } catch (error) {
    return new NextResponse("Erro Interno", { status: 500 });
  }
}

// --- POST, PUT e DELETE (Pode manter os mesmos que você já tem, eles estavam ok) ---
// Vou incluir apenas o export para não quebrar o arquivo, mas o foco da mudança foi o GET acima.

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

    revalidateTag(`mediastatus-${userId}`);
    revalidateTag(`schedule-${userId}`);
    if (session.user.username) {
        revalidateTag(`user-profile-${session.user.username.toLowerCase()}`);
    }

    return NextResponse.json(mediaStatus);
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Erro Interno" }), { status: 500 });
  }
}

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

    revalidateTag(`mediastatus-${userId}`);
    revalidateTag(`schedule-${userId}`);
    if (session.user.username) {
        revalidateTag(`user-profile-${session.user.username.toLowerCase()}`);
    }

    return NextResponse.json(updated);
  } catch (error) {
    return new NextResponse("Erro Interno", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Não autorizado", { status: 401 });
  const userId = session.user.id;
  const id = new URL(request.url).searchParams.get("id");

  if (!id) return new NextResponse("ID faltando", { status: 400 });

  try {
    await prisma.mediaStatus.delete({ where: { id, userId } });
    revalidateTag(`mediastatus-${userId}`);
    revalidateTag(`schedule-${userId}`);
    if (session.user.username) {
        revalidateTag(`user-profile-${session.user.username.toLowerCase()}`);
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse("Erro Interno", { status: 500 });
  }
}