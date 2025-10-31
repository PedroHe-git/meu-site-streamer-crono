// app/api/search-anime/route.ts
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

// Esta função será chamada quando acedermos a /api/search-anime?query=...
export async function GET(request: Request) {
  // 1. Pegamos o "query" da URL
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return new NextResponse("Query de busca faltando", { status: 400 });
  }

  // 2. Montamos a URL da API Jikan (MyAnimeList)
  //    &sfw = "Safe For Work" (Filtra conteúdo adulto, igual ao que fizemos no TMDB)
  const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(
    query
  )}&sfw`;

  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  };

  try {
    // 3. Chamamos a API externa (NÃO precisa de chave/token!)
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error("Falha ao buscar dados do Jikan (MyAnimeList)");
    }

    const data = await res.json();

    // 4. Retornamos os resultados
    //    (Importante: A Jikan API envolve os resultados num objeto 'data')
    return NextResponse.json(data.data);

  } catch (error) {
    console.error("Erro na API de busca de anime:", error);
    return new NextResponse("Erro interno ao buscar animes", { status: 500 });
  }
}