import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';

// --- GET: Busca todos os agendamentos futuros ---
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
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

    const scheduleItems = await prisma.scheduleItem.findMany({
      where: {
        userId: user.id,
        scheduledAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } 
      },
      include: {
        media: true, 
      },
      orderBy: [ 
        { scheduledAt: 'asc' },
        { horario: 'asc' },
      ],
    });

    return NextResponse.json(scheduleItems);

  } catch (error) {
    console.error("Erro ao buscar cronograma:", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}

// --- POST: Adiciona um novo item ao agendamento ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
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
      mediaId, 
      scheduledAt, 
      horario, 
      // --- [MUDANÇA AQUI] ---
      seasonNumber,
      episodeNumber,    // Início
      episodeNumberEnd  // Fim
      // --- [FIM MUDANÇA] ---
    } = body;

    if (!mediaId || !scheduledAt) {
      return new NextResponse("Dados insuficientes", { status: 400 });
    }

    // --- [MUDANÇA AQUI] ---
    // Converte os números (que podem ser "") para Int ou null
    const finalSeason = seasonNumber ? parseInt(seasonNumber) : null;
    const finalEpisode = episodeNumber ? parseInt(episodeNumber) : null;
    const finalEpisodeEnd = episodeNumberEnd ? parseInt(episodeNumberEnd) : null;
    // --- [FIM MUDANÇA] ---

    const newItem = await prisma.scheduleItem.create({
      data: {
        userId: user.id,
        mediaId: mediaId,
        scheduledAt: new Date(scheduledAt),
        horario: horario,
        // --- [MUDANÇA AQUI] ---
        seasonNumber: finalSeason,
        episodeNumber: finalEpisode,
        episodeNumberEnd: finalEpisodeEnd,
        // --- [FIM MUDANÇA] ---
      },
    });

    return NextResponse.json(newItem);

  } catch (error) {
    console.error("Erro ao criar item no cronograma:", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}

// --- DELETE: Remove um item do agendamento ---
export async function DELETE(request: Request) {
  // ... (código existente - sem mudanças)
  const session = await getServerSession(authOptions);
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("ID do item faltando", { status: 400 });
    }

    await prisma.scheduleItem.delete({
      where: {
        id: id,
        userId: user.id, 
      },
    });

    return new NextResponse("Item removido", { status: 200 });
  
  } catch (error) {
    console.error("Erro ao deletar item do cronograma:", error);
    return new NextResponse("Erro interno", { status: 500 });
  }
}

