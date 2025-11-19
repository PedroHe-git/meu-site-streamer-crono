// app/api/search/route.ts
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
    return new NextResponse(JSON.stringify({ error: "Query faltando" }), { status: 400 });
  }

  const tmdbApiKey = process.env.TMDB_API_KEY;
  if (!tmdbApiKey) {
    return new NextResponse(JSON.stringify({ error: "API Key não configurada" }), { status: 500 });
  }

  const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=pt-BR&include_adult=false&api_key=${tmdbApiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Falha TMDB");

    const data = await res.json();

    const results = data.results.map((movie: any) => ({
      source: "MOVIE",
      tmdbId: movie.id, 
      malId: null,       
      title: movie.title,
      posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      releaseYear: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
    }));
    
    return NextResponse.json(results);

  } catch (error: any) {
    console.error("Erro busca filmes:", error.message);
    return new NextResponse(JSON.stringify({ error: "Erro ao buscar filmes" }), { status: 500 });
  }
}