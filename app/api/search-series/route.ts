// app/api/search-series/route.ts
import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return new NextResponse(JSON.stringify({ error: "Query 'q' faltando" }), { status: 400 });
  }

  const tmdbApiKey = process.env.TMDB_API_KEY;
  if (!tmdbApiKey) {
    console.error("Chave API do TMDB não configurada");
    return new NextResponse(JSON.stringify({ error: "Chave API não configurada" }), { status: 500 });
  }

  const url = `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(
    query
  )}&language=pt-BR&include_adult=false&api_key=${tmdbApiKey}`; 

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
      console.error("Falha ao buscar dados de Séries no TMDB:", errorData);
      throw new Error(errorData.status_message || "Falha ao buscar dados do TMDB");
    }
    const data = await res.json();

    // --- [INÍCIO DA CORREÇÃO] ---
    // Garante o envio de 'tmdbId' e 'malId'
    const results = data.results.map((serie: any) => ({
      source: "SERIES",
      tmdbId: serie.id, // Envia tmdbId
      malId: null,       // Envia malId nulo
      title: serie.name,
      posterPath: serie.poster_path ? `https://image.tmdb.org/t/p/w500${serie.poster_path}` : null,
      releaseYear: serie.first_air_date ? parseInt(serie.first_air_date.split('-')[0]) : null,
    }));
    // --- [FIM DA CORREÇÃO] ---

    return NextResponse.json(results);

  } catch (error: any) {
    console.error("Erro na API de busca de Séries:", error.message);
    return new NextResponse(JSON.stringify({ error: "Erro interno ao buscar séries" }), { status: 500 });
  }
}