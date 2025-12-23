import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { revalidateTag, unstable_cache } from "next/cache";

export const runtime = 'nodejs';

// --- FUNÇÃO POST (Adicionar Item) ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Não autorizado", { status: 401 });
  const userId = session.user.id;

  try {
    const body = await request.json();
    const { status, title, tmdbId, malId, igdbId, posterPath, mediaType, isWeekly } = body;

    // Lógica de Mídia (Simplificada para o exemplo, mantenha a sua completa)
    let media = await prisma.media.findFirst({
        where: mediaType === 'ANIME' ? { malId: Number(malId) } : { title }
    });

    if (!media) {
      media = await prisma.media.create({
        data: { title, tmdbId: Number(tmdbId), malId: Number(malId), igdbId: Number(igdbId), posterPath, mediaType }
      });
    }

    const mediaStatus = await prisma.mediaStatus.upsert({
      where: { userId_mediaId: { userId, mediaId: media.id } },
      update: { status, isWeekly: !!isWeekly, updatedAt: new Date() },
      create: { userId, mediaId: media.id, status, isWeekly: !!isWeekly }
    });

    // ⚡ SINCRONIZAÇÃO DE CACHE (O SEGREDO)
    // Limpamos a TAG que engloba TODAS as páginas e filtros
    revalidateTag(`mediastatus-${userId}`); 
    revalidateTag(`schedule`); // Limpa para não dar "mídia corrompida" no agendamento
    
    if (session.user.username) {
        const userTag = session.user.username.toLowerCase();
        revalidateTag(`list-${userTag}`); 
        revalidateTag(`user-profile-${userTag}`);
        revalidateTag(`simple-schedule-${userTag}`);
    }

    return NextResponse.json(mediaStatus);
  } catch (error) {
    return new NextResponse("Erro Interno", { status: 500 });
  }
}

// --- FUNÇÃO PUT (Atualizar Item) ---
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Não autorizado", { status: 401 });
  const userId = session.user.id;

  try {
    const { id, status, isWeekly } = await request.json();
    const updated = await prisma.mediaStatus.update({
      where: { id, userId }, // Segurança: garante que o item é do usuário
      data: { status, isWeekly, updatedAt: new Date() }
    });

    // ⚡ LIMPEZA DE CACHE
    revalidateTag(`mediastatus-${userId}`);
    if (session.user.username) {
        revalidateTag(`list-${session.user.username.toLowerCase()}`);
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
        revalidateTag(`list-${session.user.username.toLowerCase()}`);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse("Erro Interno", { status: 500 });
  }
}

// --- FUNÇÃO GET (Otimizada para Paginação sem Duplicados) ---
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "ALL";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "12");
  const searchTerm = searchParams.get("searchTerm") || "";
  const userId = session.user.id;

  try {
    const getCachedData = unstable_cache(
      async () => {
        const where: any = { userId };
        if (status !== "ALL") where.status = status;
        if (searchTerm) {
          where.media = { title: { contains: searchTerm, mode: 'insensitive' } };
        }

        const [items, total] = await Promise.all([
          prisma.mediaStatus.findMany({
            where: where,
            include: { media: true },
            orderBy: { updatedAt: "desc" },
            take: pageSize,
            skip: (page - 1) * pageSize,
          }),
          prisma.mediaStatus.count({ where }),
        ]);

        return { items, total, totalPages: Math.ceil(total / pageSize) };
      },
      // A chave individual garante que o cache de uma página não sobrescreva outra
      [`mediastatus-${userId}-${status}-${page}-${searchTerm}`], 
      {
        revalidate: 3600,
        // 👈 A TAG É A CHAVE: Ao limpar esta tag, a Vercel mata TODAS as chaves acima
        tags: [`mediastatus-${userId}`] 
      }
    );

    const data = await getCachedData();
    return NextResponse.json(data);
  } catch (error) {
    return new NextResponse("Erro Interno", { status: 500 });
  }
}