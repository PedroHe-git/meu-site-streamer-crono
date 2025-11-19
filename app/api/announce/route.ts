// app/api/announce/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { sendWeeklySchedule } from "@/lib/discord";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const userId = session.user.id;

  try {
    // 1. Buscar dados do utilizador (Webhook e Nome)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { discordWebhookUrl: true, name: true, username: true }
    });

    if (!user?.discordWebhookUrl) {
      return new NextResponse(JSON.stringify({ error: "Webhook do Discord não configurado" }), { status: 400 });
    }

    // 2. Buscar itens da agenda (Apenas Pendentes e Futuros)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Começo do dia de hoje

    const scheduleItems = await prisma.scheduleItem.findMany({
      where: {
        userId: userId,
        isCompleted: false,
        scheduledAt: {
          gte: today // Apenas itens de hoje em diante
        }
      },
      include: { media: true },
      orderBy: { scheduledAt: 'asc' },
      take: 20 // Limite de segurança para não estourar o Discord
    });

    if (scheduleItems.length === 0) {
      return new NextResponse(JSON.stringify({ error: "Nenhum item agendado para anunciar" }), { status: 400 });
    }

    // 3. Enviar para o Discord
    await sendWeeklySchedule(
      user.discordWebhookUrl,
      user.name || user.username,
      scheduleItems
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[ANNOUNCE_POST]", error);
    return new NextResponse("Erro Interno", { status: 500 });
  }
}