// app/api/search-anime/route.ts
import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const revalidate = 0; 

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // 1. CORREÇÃO: Ouvir o parâmetro "q" (enviado pelo MediaSearch.tsx)
  const query = searchParams.get("q"); 

  if (!query) {
    return new NextResponse(JSON.stringify({ error: "Query 'q' faltando" }), { status: 400 });
  }

  // 2. MANTER a API Jikan (como o seu projeto original)
  const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10&sfw=true`; // Adicionado sfw=true para segurança

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

    // 3. CORREÇÃO: Formatar a resposta do Jikan para o formato do MediaSearch.tsx
    // Jikan usa 'data.data'
    // MediaSearch espera { source, sourceId, title, posterPath, releaseYear }
    
    const results = data.data.map((anime: any) => ({
      source: "ANIME", // Definir a fonte
      sourceId: anime.mal_id, // ID do MyAnimeList
      title: anime.title,
      posterPath: anime.images?.jpg?.image_url || null,
      releaseYear: anime.year || (anime.aired?.from ? parseInt(anime.aired.from.split('-')[0]) : null),
    }));

    return NextResponse.json(results); // Retornar os dados formatados

  } catch (error: any) {
    console.error("Erro na API de busca de Animes (Jikan):", error.message);
    return new NextResponse(JSON.stringify({ error: "Erro interno ao buscar animes" }), { status: 500 });
  }
}