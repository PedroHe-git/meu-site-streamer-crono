import { NextResponse } from "next/server";

// 1. OTIMIZAÇÃO CRÍTICA:
// Define que o cache desta rota dura 60 segundos.
// Mesmo que 1000 pessoas acessem, a Vercel só executa a função 1 vez por minuto.
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

    // 2. Obter Token (Com Cache de 1 hora)
    // Usamos 'next: { revalidate: 3600 }' para reutilizar o token e não pedir a toda hora
    const tokenRes = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
      {
        method: "POST",
        next: { revalidate: 3600 }
      }
    );

    if (!tokenRes.ok) {
      console.error("[TWITCH_API] Erro ao pegar token");
      return NextResponse.json({ isLive: false });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 3. Consultar Status do Canal (Com Cache de 60 segundos)
    const cleanChannel = channel.trim().toLowerCase();

    const streamRes = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${cleanChannel}`,
      {
        headers: {
          "Client-ID": clientId,
          "Authorization": `Bearer ${accessToken}`,
        },
        // Garante que o fetch da Twitch também obedeça o cache de 60s
        next: { revalidate: 60 }
      }
    );

    if (!streamRes.ok) {
      return NextResponse.json({ isLive: false });
    }

    const streamData = await streamRes.json();
    const stream = streamData.data?.[0]; // Pega o primeiro item do array
    const isLive = stream?.type === 'live';
    
    // Se não estiver ao vivo, retornamos imediatamente
    if (!isLive) {
       return NextResponse.json({ isLive: false });
    }

    // 4. Processar Thumbnail
    // Substitui os placeholders {width}x{height} pelo tamanho real (Full HD)
    let thumbnailUrlBase = stream.thumbnail_url
      ? stream.thumbnail_url.replace("{width}", "1920").replace("{height}", "1080")
      : null;

    // Adiciona timestamp para forçar o navegador a mostrar a imagem atualizada (evita cache visual antigo)
    // Como a rota roda a cada 60s, o timestamp mudará a cada minuto, atualizando a imagem.
    let finalThumbnailUrl = thumbnailUrlBase;
    if (thumbnailUrlBase) {
        const timestamp = new Date().getTime();
        finalThumbnailUrl = `${thumbnailUrlBase}?t=${timestamp}`;
    }

    return NextResponse.json({ 
      isLive: true, 
      liveTitle: stream.title, 
      gameName: stream.game_name,
      viewerCount: stream.viewer_count,
      thumbnailUrl: finalThumbnailUrl 
    });

  } catch (error) {
    console.error("[TWITCH_API_ERROR]", error);
    return NextResponse.json({ isLive: false });
  }
}