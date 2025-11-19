// app/api/search-games/route.ts
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ratelimit";
import { headers } from "next/headers";

export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  // 1. Rate Limit (60 buscas por minuto)
  const headersList = headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip, 60, 60 * 1000)) {
    return new NextResponse(JSON.stringify({ error: "Muitas pesquisas. Aguarde." }), { status: 429 });
  }

  if (!query) {
    return new NextResponse(JSON.stringify({ error: "Query 'q' faltando" }), { status: 400 });
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new NextResponse(JSON.stringify({ error: "Chaves da Twitch não configuradas" }), { status: 500 });
  }

  try {
    // 2. Obter Token Twitch
    const tokenUrl = `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`;
    const tokenRes = await fetch(tokenUrl, { method: 'POST' });
    
    if (!tokenRes.ok) throw new Error("Falha ao obter token");
    
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 3. Query Limpa para IGDB (Sem comentários e sem aspas na string de busca)
    // Removemos o filtro 'category' para ser mais abrangente (encontrar Dota, etc)
    const cleanQuery = query.replace(/"/g, '');
    const igdbQuery = `search "${cleanQuery}"; fields name, cover.url, first_release_date; limit 20;`;

    const gamesRes = await fetch("https://api.igdb.com/v4/games", {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'text/plain'
      },
      body: igdbQuery
    });

    if (!gamesRes.ok) throw new Error("Erro na IGDB");

    const gamesData = await gamesRes.json();

    const results = gamesData.map((game: any) => {
      let posterUrl = null;
      if (game.cover && game.cover.url) {
        // Ajusta URL da capa para alta qualidade
        posterUrl = `https:${game.cover.url}`.replace("t_thumb", "t_cover_big");
      }

      return {
        source: "GAME",
        tmdbId: null,
        malId: null,
        igdbId: game.id,
        title: game.name,
        posterPath: posterUrl,
        releaseYear: game.first_release_date 
          ? new Date(game.first_release_date * 1000).getFullYear() 
          : null,
      };
    });

    return NextResponse.json(results);

  } catch (error: any) {
    console.error("[IGDB] Catch Error:", error);
    return new NextResponse(JSON.stringify({ error: "Erro interno ao buscar jogos" }), { status: 500 });
  }
}