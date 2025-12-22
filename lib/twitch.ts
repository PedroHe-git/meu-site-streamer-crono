export async function getTwitchStatus() {
  const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
  const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
  const USER_LOGIN = "MahMoojen"; // Seu usuário da Twitch

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("Faltam variáveis de ambiente da Twitch (CLIENT_ID ou SECRET)");
    return { isLive: false };
  }

  try {
    // 1. Pegar Token de Acesso
    // Correção: Cache de 1 hora (3600s) para não pedir token toda hora
    const tokenRes = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`, {
      method: "POST",
      next: { revalidate: 3600 }, 
    });

    if (!tokenRes.ok) throw new Error("Falha ao pegar token da Twitch");
    
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Pegar Status da Stream
    // Correção: Cache de 60s (ISR) em vez de 'no-store'. Isso conserta o build.
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
      // Troca a resolução da thumb para HD
      thumbnail_url: stream.thumbnail_url?.replace("{width}", "1280").replace("{height}", "720"),
    };

  } catch (error) {
    console.error("Erro na API da Twitch:", error);
    return { isLive: false };
  }
}