// app/api/schedule/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { Prisma, ScheduleItem } from "@prisma/client";

export const runtime = 'nodejs';
export const revalidate = 0; 

// --- FUNÇÃO GET (Listar Agenda) ---
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session?.user?.id) {
    return new NextResponse("Não autorizado", { status: 401 });
  }
  // @ts-ignore
  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const list = searchParams.get("list");

  let whereClause: Prisma.ScheduleItemWhereInput = {
    userId: userId,
  };

  let orderByClause: Prisma.ScheduleItemOrderByWithRelationInput = {
    scheduledAt: 'asc', // Padrão: mais antigos primeiro
  };

  // --- [INÍCIO DA CORREÇÃO] ---
  if (list === 'pending') {
    whereClause.isCompleted = false;
    // REMOVEMOS o filtro de data (gte: new Date())
    // Agora, ele vai buscar TODOS os itens não concluídos, incluindo os passados.
    orderByClause = { scheduledAt: 'asc' }; // Os mais antigos (atrasados) aparecem primeiro
    
  } else if (list === 'completed') {
    whereClause.isCompleted = true;
    orderByClause = { scheduledAt: 'desc' }; // Os mais recentes concluídos aparecem primeiro
  }
  // --- [FIM DA CORREÇÃO] ---

  try {
    const scheduleItems = await prisma.scheduleItem.findMany({
      where: whereClause,
      include: {
        media: true, // Inclui os dados da mídia (poster, título)
      },
      orderBy: orderByClause,
      // Se a lista de concluídos ficar muito grande, adicione paginação aqui
      ...(list === 'completed' && { take: 10 }), // Ex: Limita a 10 concluídos
    });

    return NextResponse.json(scheduleItems);
  } catch (error) {
    console.error("[SCHEDULE_GET]", error);
    return new NextResponse(JSON.stringify({ error: "Erro Interno" }), { status: 500 });
  }
}

// --- FUNÇÃO POST (Adicionar na Agenda) ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session?.user?.id) {
    return new NextResponse("Não autorizado", { status: 401 });
  }
  // @ts-ignore
  const userId = session.user.id;

  try {
    const body = await request.json();
    const { 
      mediaId, 
      scheduledAt, 
      horario, 
      seasonNumber, 
      episodeNumber, 
      episodeNumberEnd 
    } = body;

    if (!mediaId || !scheduledAt) {
      return new NextResponse(JSON.stringify({ error: "ID da Mídia e Data são obrigatórios" }), { status: 400 });
    }

    // Verifica se o MediaStatus (o item na lista) pertence ao utilizador
    const mediaStatus = await prisma.mediaStatus.findFirst({
      where: {
        mediaId: mediaId,
        userId: userId,
      },
    });

    if (!mediaStatus) {
      return new NextResponse(JSON.stringify({ error: "Este item não está nas suas listas" }), { status: 404 });
    }
    // (Opcional) Verifica se o status é 'WATCHING'
    if (mediaStatus.status !== 'WATCHING') {
       return new NextResponse(JSON.stringify({ error: "Apenas itens da lista 'Esta Semana' podem ser agendados" }), { status: 400 });
    }

    const newScheduleItem = await prisma.scheduleItem.create({
      data: {
        userId: userId,
        mediaId: mediaId,
        scheduledAt: new Date(scheduledAt),
        horario: horario || null,
        seasonNumber: seasonNumber ? parseInt(seasonNumber) : null,
        episodeNumber: episodeNumber ? parseInt(episodeNumber) : null,
        episodeNumberEnd: episodeNumberEnd ? parseInt(episodeNumberEnd) : null,
        isCompleted: false,
      },
      include: { // Inclui a mídia para o retorno
        media: true,
      }
    });

    return NextResponse.json(newScheduleItem);
  } catch (error) {
    console.error("[SCHEDULE_POST]", error);
    return new NextResponse(JSON.stringify({ error: "Erro Interno" }), { status: 500 });
  }
}


// --- FUNÇÃO DELETE (Remover da Agenda) ---
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session?.user?.id) {
    return new NextResponse("Não autorizado", { status: 401 });
  }
  // @ts-ignore
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id"); // Espera o ID na URL

  if (!id) {
    return new NextResponse(JSON.stringify({ error: "ID do agendamento faltando" }), { status: 400 });
  }

  try {
    // Verifica se o item pertence ao utilizador antes de apagar
    const scheduleItem = await prisma.scheduleItem.findUnique({
      where: { id: id },
    });

    if (!scheduleItem || scheduleItem.userId !== userId) {
      return new NextResponse("Não autorizado", { status: 403 });
    }

    await prisma.scheduleItem.delete({
      where: { id: id },
    });

    return new NextResponse(null, { status: 204 }); // Sucesso
  } catch (error) {
    console.error("[SCHEDULE_DELETE]", error);
    return new NextResponse(JSON.stringify({ error: "Erro Interno" }), { status: 500 });
  }
}