import { NextResponse } from "next/server";
// --- [IMPORT V4] ---
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
// --- [FIM IMPORT V4] ---
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client'; // Importa Prisma para tipos

export const revalidate = 0;
export const runtime = 'nodejs';


// --- GET: Busca todos os agendamentos futuros ---
export async function GET(request: Request) {
  const session = await getServerSession(authOptions); // Usa authOptions v4
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
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    // Define a condição base
    const whereCondition: Prisma.ScheduleItemWhereInput = {
      userId: user.id,
    };

    // --- [INÍCIO DA CORREÇÃO] ---
    // 2. Lógica de data atualizada
    if (startDate && endDate) {
      // Caso 1: FullCalendar (tem início E fim)
      whereCondition.scheduledAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
      // (Não filtra por isCompleted, pois o calendário quer ver tudo)

    } else if (startDate && !endDate) {
      // Caso 2: ScheduleManager (tem apenas início)
      // O 'startDate' é o início do "hoje" do cliente, vindo como ISO string
      whereCondition.scheduledAt = {
        gte: new Date(startDate),
      };
      whereCondition.isCompleted = false; // A lista só mostra itens pendentes

    } else {
      // Caso 3: Fallback (se nenhuma data for enviada - comportamento antigo)
      // Esta lógica pode ter problemas de fuso horário em Vercel (UTC)
      whereCondition.scheduledAt = {
        gte: new Date(new Date().setHours(0, 0, 0, 0)), 
      };
      whereCondition.isCompleted = false;
    }
    // --- [FIM DA CORREÇÃO] ---

    // 3. Busca no banco de dados USANDO a 'whereCondition' correta
    const scheduleItems = await prisma.scheduleItem.findMany({
      where: whereCondition, 
      include: {
        media: true, // Inclui a mídia
      },
      orderBy: [ // Ordena por data e depois por hora
        { scheduledAt: 'asc' },
        { horario: 'asc' },
      ],
    });

    return NextResponse.json(scheduleItems);

  } catch (error) {
    console.error("Erro ao buscar cronograma:", error);
    return new NextResponse(JSON.stringify({ error: "Erro interno ao buscar cronograma" }), { status: 500 });
  }
}

// --- POST: Adiciona um novo item ao agendamento ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions); // Usa authOptions v4
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
      // Recebe os campos de T/E (podem ser string vazia ou número)
      seasonNumber,
      episodeNumber,
      episodeNumberEnd
    } = body;

    if (!mediaId || !scheduledAt) {
      return new NextResponse(JSON.stringify({ error: "Dados insuficientes (mediaId, scheduledAt)" }), { status: 400 });
    }

    // Converte os números (que podem ser "" ou null) para Int ou null
    const finalSeason = seasonNumber ? parseInt(String(seasonNumber)) : null;
    const finalEpisode = episodeNumber ? parseInt(String(episodeNumber)) : null;
    const finalEpisodeEnd = episodeNumberEnd ? parseInt(String(episodeNumberEnd)) : null;

    // Validação extra: Ep. Fim não pode ser menor que Ep. Início
    if (finalEpisode !== null && finalEpisodeEnd !== null && finalEpisodeEnd < finalEpisode) {
        return new NextResponse(JSON.stringify({ error: "Episódio final não pode ser menor que o inicial" }), { status: 400 });
    }

    const newItem = await prisma.scheduleItem.create({
      data: {
        userId: user.id,
        mediaId: mediaId,
        scheduledAt: new Date(scheduledAt), // Garante que é um objeto Date
        horario: horario || null, // Guarda null se vazio
        seasonNumber: finalSeason,
        episodeNumber: finalEpisode,
        episodeNumberEnd: finalEpisodeEnd,
      },
    });

    return NextResponse.json(newItem);

  } catch (error) {
    console.error("Erro ao criar item no cronograma:", error);
     // Adiciona tratamento para erros específicos do Prisma se necessário
    if (error instanceof Prisma.PrismaClientValidationError) {
        return new NextResponse(JSON.stringify({ error: "Dados inválidos fornecidos" }), { status: 400 });
    }
    return new NextResponse(JSON.stringify({ error: "Erro interno ao criar item no cronograma" }), { status: 500 });
  }
}

// --- DELETE: Remove um item do agendamento ---
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions); // Usa authOptions v4
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

    // Extrai o ID do parâmetro de busca da URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse(JSON.stringify({ error: "ID do item faltando na URL" }), { status: 400 });
    }

    // Garante que o item pertence ao usuário antes de deletar
    await prisma.scheduleItem.delete({
      where: {
        id: id,
        userId: user.id, // Segurança: só permite deletar os próprios itens
      },
    });

    // Retorna sucesso sem corpo (status 204) ou com mensagem simples (status 200)
    return new NextResponse("Item removido com sucesso", { status: 200 });

  } catch (error) {
    console.error("Erro ao deletar item do cronograma:", error);
    // Trata erro caso o item não seja encontrado (ex: já deletado)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
       return new NextResponse(JSON.stringify({ error: "Erro: Item a ser deletado não foi encontrado." }), { status: 404 });
    }
    return new NextResponse(JSON.stringify({ error: "Erro interno ao deletar item" }), { status: 500 });
  }
}