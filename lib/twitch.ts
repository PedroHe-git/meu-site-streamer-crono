// lib/twitch.ts
import { unstable_cache } from "next/cache";

// --- 1. Função Auxiliar de Autenticação (Reutilizável) ---
export async function getAppAccessToken() {
  const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
  const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.warn("⚠️ Twitch Credentials missing");
    return null;
  }

  try {
    const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
      next: { revalidate: 3600 }, // Cache do token por 1 hora
    });

    if (!tokenRes.ok) throw new Error("Falha auth Twitch");
    
    const tokenData = await tokenRes.json();
    return tokenData.access_token;
  } catch (error) {
    console.error("Erro ao pegar token Twitch:", error);
    return null;
  }
}

// --- 2. Status da Live (Online/Offline) ---
export async function getTwitchStatus() {
  const USER_LOGIN = process.env.TWITCH_CHANNEL_NAME || "MahMoojen"; 
  const CLIENT_ID = process.env.TWITCH_CLIENT_ID;

  try {
    const accessToken = await getAppAccessToken();
    if (!accessToken) return { isLive: false };

    const streamRes = await fetch(`https://api.twitch.tv/helix/streams?user_login=${USER_LOGIN}`, {
      headers: {
        "Client-ID": CLIENT_ID!,
        "Authorization": `Bearer ${accessToken}`,
      },
      next: { revalidate: 60 },
    });

    if (!streamRes.ok) return { isLive: false };

    const streamData = await streamRes.json();
    const stream = streamData.data?.[0];

    if (!stream) return { isLive: false };

    return {
      isLive: true,
      viewer_count: stream.viewer_count,
      title: stream.title,
      game_name: stream.game_name,
      thumbnail_url: stream.thumbnail_url?.replace("{width}", "1280").replace("{height}", "720"),
    };

  } catch (error) {
    return { isLive: false };
  }
}

// --- 3. Estatísticas do Canal (Media Kit) ---
export async function getTwitchChannelStats(broadcasterId: string) {
  const CLIENT_ID = process.env.TWITCH_CLIENT_ID;

  try {
    const accessToken = await getAppAccessToken();
    if (!accessToken) return null;

    // A. Pegar Dados do Usuário (Views Totais do Canal)
    const userRes = await fetch(`https://api.twitch.tv/helix/users?id=${broadcasterId}`, {
      headers: {
        "Client-Id": CLIENT_ID!,
        "Authorization": `Bearer ${accessToken}`,
      },
      cache: "no-store"
    });
    
    const userData = await userRes.json();
    const user = userData.data?.[0];

    // B. Pegar Seguidores
    const followersRes = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${broadcasterId}`, {
      headers: {
        "Client-Id": CLIENT_ID!,
        "Authorization": `Bearer ${accessToken}`,
      },
      cache: "no-store"
    });
    
    const followersData = await followersRes.json();

    return {
      followers: followersData.total || 0,
      totalViews: user?.view_count || 0
    };
  } catch (error) {
    console.error("Erro Twitch Stats:", error);
    return null;
  }
}