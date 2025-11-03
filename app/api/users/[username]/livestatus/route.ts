// app/api/users/[username]/livestatus/route.ts (Atualizado)

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const revalidate = 60; // Cache de 1 minuto

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;

    const user = await prisma.user.findUnique({
      // --- [CORREÇÃO] ---
      where: { username: decodeURIComponent(username).toLowerCase() },
      // --- [FIM DA CORREÇÃO] ---
      select: { twitchUsername: true },
    });

    if (!user || !user.twitchUsername) {
      return NextResponse.json({ isLive: false, error: "Utilizador não encontrado ou Twitch não vinculada" });
    }

    // (A sua lógica de 'fetch' da API da Twitch iria aqui)
    // Por enquanto, vamos simular
    // const response = await fetch(`https.../helix/streams?user_login=${user.twitchUsername}`, ...headers);
    // const data = await response.json();
    // const isLive = data.data && data.data.length > 0;
    
    // Simulação
    const isLive = false; 

    return NextResponse.json({ isLive });

  } catch (error) {
    console.error("[LIVESTATUS_GET]", error);
    return new NextResponse("Erro Interno", { status: 500 });
  }
}