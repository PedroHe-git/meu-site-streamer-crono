// app/api/search/route.ts
import { NextResponse } from "next/server";

export const runtime = 'nodejs';


// Esta função será chamada quando acessarmos /api/search?query=...
export async function GET(request: Request) {
  // 1. Pegamos o "query" da URL
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return new NextResponse("Query de busca faltando", { status: 400 });
  }

  // 2. Pegamos nossa chave secreta do .env
  const tmdbApiKey = process.env.TMDB_API_KEY;
  if (!tmdbApiKey) {
    return new NextResponse("Chave API do TMDB não configurada", { status: 500 });
  }

  // 3. Montamos a URL da API externa
  const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
    query
  )}&language=pt-BR&include_adult=false`;

  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      // A API do TMDB usa "Bearer Token"
      Authorization: `Bearer ${tmdbApiKey}`,
    },
  };

  try {
    // 4. Chamamos a API externa e retornamos a resposta
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error("Falha ao buscar dados do TMDB");
    }
    const data = await res.json();

    // Retornamos apenas a lista de 'results' para o nosso frontend
    return NextResponse.json(data.results);

  } catch (error) {
    console.error("Erro na API de busca:", error);
    return new NextResponse("Erro interno ao buscar filmes", { status: 500 });
  }
}