// app/api/search-anime/route.ts
import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const revalidate = 0; 

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q"); 

  if (!query) {
    return new NextResponse(JSON.stringify({ error: "Query 'q' faltando" }), { status: 400 });
  }

  const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10&sfw=true`;

  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  };

  try {
    const res = await fetch(url, options);
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error("Falha ao buscar dados do Jikan:", errorData);
      throw new Error(errorData.message || "Falha ao buscar dados do Jikan");
    }
    
    const data = await res.json();
    
    // --- [INÍCIO DA CORREÇÃO] ---
    // Garante o envio de 'tmdbId' e 'malId'
    const results = data.data.map((anime: any) => ({
      source: "ANIME",
      tmdbId: null,       // Envia tmdbId nulo
      malId: anime.mal_id, // Envia malId
      title: anime.title,
      posterPath: anime.images?.jpg?.image_url || null,
      releaseYear: anime.year || (anime.aired?.from ? parseInt(anime.aired.from.split('-')[0]) : null),
    }));
    // --- [FIM DA CORREÇÃO] ---

    return NextResponse.json(results);

  } catch (error: any) {
    console.error("Erro na API de busca de Animes (Jikan):", error.message);
    return new NextResponse(JSON.stringify({ error: "Erro interno ao buscar animes" }), { status: 500 });
  }
}