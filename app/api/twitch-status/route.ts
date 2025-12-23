import { NextResponse } from 'next/server';

// Tipo para ajudar o TypeScript
interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: 'live' | '';
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
}

// Vamos guardar o token em cache para não pedir um novo a cada chamada
let appAccessToken: string | null = null;
let tokenExpiresAt: number | null = null;

/**
 * Busca um App Access Token da Twitch, necessário para a API.
 */
async function getTwitchToken(): Promise<string> {
  // Se já temos um token e ele não expirou, reutilize
  if (appAccessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    return appAccessToken;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Variáveis de ambiente da Twitch não configuradas');
  }

  // 🛑 CORREÇÃO: Enviar credenciais no CORPO da requisição (Body)
  // Isso evita o erro 400 (Bad Request) que acontecia ao enviar pela URL
  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
    next: { revalidate: 3600 } // Cache de 1 hora no fetch
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao buscar token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  appAccessToken = data.access_token;
  // Define a expiração para 1 hora (segurança)
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000; 

  return appAccessToken as string;
}

/**
 * Handler da API. Isso é o que será executado quando acessarmos /api/twitch-status
 */
export async function GET() {
  try {
    const channelName = process.env.TWITCH_CHANNEL_NAME;
    
    // Se não tiver canal configurado, retorna offline sem erro
    if (!channelName) {
      return NextResponse.json({ isLive: false });
    }

    const token = await getTwitchToken();
    const clientId = process.env.TWITCH_CLIENT_ID;

    const streamResponse = await fetch(`https://api.twitch.tv/helix/streams?user_login=${channelName}`, {
      headers: {
        'Client-ID': clientId!,
        'Authorization': `Bearer ${token}`,
      },
      // Revalida o cache a cada 60 segundos
      next: { revalidate: 60 } 
    });

    if (!streamResponse.ok) {
      console.error(`Erro Twitch Stream: ${streamResponse.statusText}`);
      // Se falhar a busca da stream, retorna offline em vez de quebrar a página
      return NextResponse.json({ isLive: false });
    }

    const streamData = await streamResponse.json();
    const stream: TwitchStream | null = streamData.data?.[0]; // Proteção contra array vazio

    // Se `stream` existir, o canal está ao vivo
    if (stream && stream.type === 'live') {
      return NextResponse.json({
        isLive: true,
        title: stream.title,
        gameName: stream.game_name,
        viewerCount: stream.viewer_count,
      });
    } else {
      // Se não, está offline
      return NextResponse.json({
        isLive: false,
      });
    }

  } catch (error) {
    console.error('Erro na API da Twitch:', error);
    // Retorna offline em caso de qualquer erro crítico para não poluir o build com erro 500
    return NextResponse.json({ isLive: false });
  }
}