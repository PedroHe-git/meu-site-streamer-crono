import { unstable_cache } from "next/cache";

export async function getTwitchStatus() {
  const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
  const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
  // O nome do canal pode vir do .env ou estar fixo
  const USER_LOGIN = process.env.TWITCH_CHANNEL_NAME || "MahMoojen"; 

  // Se não tiver credenciais, nem tenta buscar (evita erro no log)
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.warn("⚠️ Twitch Credentials missing inside lib/twitch.ts");
    return { isLive: false };
  }

  try {
    // 1. Pegar Token de Acesso (Enviando no BODY agora)
    const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
      next: { revalidate: 3600 },
    });

    if (!tokenRes.ok) {
        const errorText = await tokenRes.text();
        console.error(`❌ Erro Token Twitch (${tokenRes.status}):`, errorText);
        throw new Error("Falha auth Twitch");
    }
    
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Pegar Status da Stream
    const streamRes = await fetch(`https://api.twitch.tv/helix/streams?user_login=${USER_LOGIN}`, {
      headers: {
        "Client-ID": CLIENT_ID,
        "Authorization": `Bearer ${accessToken}`,
      },
      next: { revalidate: 60 },
    });

    if (!streamRes.ok) throw new Error("Falha ao pegar dados da stream");

    const streamData = await streamRes.json();
    const stream = streamData.data?.[0];

    if (!stream) {
      return { isLive: false };
    }

    return {
      isLive: true,
      viewer_count: stream.viewer_count,
      title: stream.title,
      game_name: stream.game_name,
      thumbnail_url: stream.thumbnail_url?.replace("{width}", "1280").replace("{height}", "720"),
    };

  } catch (error) {
    // Silencia o erro no log de build para não poluir, apenas retorna offline
    return { isLive: false };
  }
}