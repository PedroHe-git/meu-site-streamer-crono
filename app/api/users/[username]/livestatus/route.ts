// app/api/users/[username]/livestatus/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export const revalidate = 0;
// Cache do Token de App (igual a antes)
let tokenCache = {
  token: null as string | null,
  expires: 0,
};

// Função getTwitchAppToken (igual a antes, necessária)
async function getTwitchAppToken(): Promise<string | null> {
  if (tokenCache.token && Date.now() < tokenCache.expires) {
    return tokenCache.token;
  }
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("Credenciais da Twitch (ID ou Secret) não encontradas.");
    return null;
  }
  try {
    const response = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
      { method: "POST" }
    );
    if (!response.ok) throw new Error("Falha ao obter token de App da Twitch");
    const data = await response.json();
    tokenCache.token = data.access_token;
    tokenCache.expires = Date.now() + (data.expires_in - 300) * 1000;
    return tokenCache.token;
  } catch (error) {
    console.error("Erro ao buscar token da Twitch:", error);
    return null;
  }
}

/**
 * GET: Verifica se um utilizador está ao vivo
 */
export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const { username } = params;

  try {
    // --- [ LÓGICA DE SEGURANÇA CORRIGIDA ] ---
    
    // 1. Encontrar o utilizador do perfil
    const user = await prisma.user.findUnique({
      where: { username: decodeURIComponent(username) },
      select: { id: true }, // Só precisamos do ID dele
    });

    if (!user) {
      return NextResponse.json({ isLive: false });
    }

    // 2. Encontrar a conta Twitch VINCULADA a esse utilizador
    const twitchAccount = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: "twitch", // Como definido no seu authOptions
      },
      select: {
        providerAccountId: true // Este é o ID NUMÉRICO da Twitch
      }
    });

    // 3. Se não houver conta vinculada, ele não pode estar "LIVE" no nosso site.
    if (!twitchAccount || !twitchAccount.providerAccountId) {
      return NextResponse.json({ isLive: false });
    }

    const twitchUserId = twitchAccount.providerAccountId;

    // 4. Obter Token de App (igual a antes)
    const appToken = await getTwitchAppToken();
    const clientId = process.env.TWITCH_CLIENT_ID;

    if (!appToken || !clientId) {
      return NextResponse.json({ isLive: false, error: "Configuração da Twitch no servidor incompleta." });
    }

    // 5. Consultar a API da Twitch usando o ID NUMÉRICO (user_id)
    // Esta é a forma correta e segura, que não usa o "login name"
    const twitchApiUrl = `https://api.twitch.tv/helix/streams?user_id=${twitchUserId}`;

    const streamResponse = await fetch(twitchApiUrl, {
      headers: {
        "Client-ID": clientId,
        "Authorization": `Bearer ${appToken}`,
      },
      next: {
        revalidate: 60, // Cache de 1 minuto
      }
    });

    if (!streamResponse.ok) {
      throw new Error("Falha ao consultar a API /helix/streams da Twitch");
    }

    const streamData = await streamResponse.json();
    const isLive = streamData.data && streamData.data.length > 0;

    return NextResponse.json({ isLive: isLive });

  } catch (error) {
    console.error(`Erro ao verificar status da live para ${username}:`, error);
    return new NextResponse(JSON.stringify({ error: "Erro interno do servidor." }), { status: 500 });
  }
}