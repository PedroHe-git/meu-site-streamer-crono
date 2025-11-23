import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel");

  if (!channel) {
    return NextResponse.json({ isLive: false });
  }

  try {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("[TWITCH_API] Credenciais não configuradas");
      return NextResponse.json({ isLive: false });
    }

    // 1. Obter Token
    const tokenRes = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
      { method: "POST", cache: 'no-store' }
    );

    if (!tokenRes.ok) {
      return NextResponse.json({ isLive: false });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Consultar Status
    const cleanChannel = channel.trim().toLowerCase();

    const streamRes = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${cleanChannel}`,
      {
        headers: {
          "Client-ID": clientId,
          "Authorization": `Bearer ${accessToken}`,
        },
        cache: 'no-store'
      }
    );

    if (!streamRes.ok) {
      return NextResponse.json({ isLive: false });
    }

    const streamData = await streamRes.json();

    const stream = streamData.data?.[0];
    const isLive = stream?.type === 'live';
    
    // Extraímos o título da live se estiver online
    const liveTitle = isLive ? stream.title : null;
    // Extraímos a categoria (jogo) também, se quiser usar
    const gameName = isLive ? stream.game_name : null;

    return NextResponse.json({ 
      isLive, 
      liveTitle, 
      gameName 
    });

  } catch (error) {
    console.error("[TWITCH_API_ERROR]", error);
    return NextResponse.json({ isLive: false });
  }
}