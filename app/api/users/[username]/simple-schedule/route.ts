// app/api/users/[username]/simple-schedule/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const runtime = 'nodejs';
export const revalidate = 0;

// Esta API é pública, não precisa de sessão
export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const { username } = params;

  try {
    const user = await prisma.user.findFirst({
      where: { 
        username: { 
          equals: decodeURIComponent(username), 
          mode: 'insensitive' 
        } 
      },
      select: { id: true } // Apenas precisamos do ID
    });

    if (!user) {
      return new NextResponse("Utilizador não encontrado", { status: 404 });
    }

    // --- [INÍCIO DA CORREÇÃO] ---
    // 1. Removemos o filtro de data (gte: new Date()) para mostrar todos
    // 2. Adicionamos 'include: { media: true }'
    const scheduleItems = await prisma.scheduleItem.findMany({
      where: {
        userId: user.id,
      },
      include: {
        media: true, // Inclui os dados da mídia (title, posterPath, etc.)
      },
      orderBy: {
        scheduledAt: 'asc', // Ordena por data (mais antigos primeiro)
      },
      take: 25, // Limitamos aos 25 mais recentes para não sobrecarregar
    });
    // --- [FIM DA CORREÇÃO] ---

    return NextResponse.json(scheduleItems);

  } catch (error) {
    console.error("[SIMPLE_SCHEDULE_GET]", error);
    return new NextResponse(JSON.stringify({ error: "Erro Interno" }), { status: 500 });
  }
}