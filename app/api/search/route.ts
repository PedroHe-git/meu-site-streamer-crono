// app/api/search/route.ts
import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(request: Request) {
  console.log("\n--- [INÍCIO DEBUG /api/search] ---");

  const { searchParams } = new URL(request.url);
  
  // 1. Verifica o parâmetro "q"
  const query = searchParams.get("q");

  if (!query) {
    console.log("Erro 400: Parâmetro 'q' não encontrado.");
    console.log("--- [FIM DEBUG /api/search] ---");
    return new NextResponse(JSON.stringify({ error: "Query 'q' faltando" }), { status: 400 });
  }
  console.log(`Parâmetro 'q' recebido: ${query}`);

  // 2. Verifica a Chave de API
  const tmdbApiKey = process.env.TMDB_API_KEY;
  if (!tmdbApiKey) {
    console.error("Erro 500: TMDB_API_KEY não foi encontrada no .env!");
    console.log("--- [FIM DEBUG /api/search] ---");
    return new NextResponse(JSON.stringify({ error: "Chave API não configurada" }), { status: 500 });
  }
  
  // Log para verificar se a chave foi lida (escondendo a maior parte)
  console.log(`TMDB_API_KEY encontrada: ...${tmdbApiKey.slice(-4)}`);

  // 3. Monta a URL de Autenticação v3 (com api_key)
  const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
    query
  )}&language=pt-BR&include_adult=false&api_key=${tmdbApiKey}`;
  
  // Loga a URL (sem a chave) para confirmar que está correta
  console.log(`Enviando requisição para o TMDB: ${url.replace(tmdbApiKey, "SUA_CHAVE")}`);

  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  };

  try {
    // 4. Tenta fazer a chamada
    const res = await fetch(url, options);
    
    if (!res.ok) {
      const errorData = await res.json(); // Pega a mensagem de erro do TMDB
      console.error("Erro 500: Falha ao buscar dados do TMDB. Resposta do TMDB:", errorData);
      console.log("--- [FIM DEBUG /api/search] ---");
      throw new Error(errorData.status_message || "Falha ao buscar dados do TMDB");
    }

    const data = await res.json();
    console.log("Sucesso: Dados recebidos do TMDB.");

    // 5. Formata a resposta
    const results = data.results.map((movie: any) => ({
      source: "MOVIE",
      sourceId: movie.id,
      title: movie.title,
      posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      releaseYear: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null,
    }));
    
    console.log(`Enviando ${results.length} resultados formatados para o frontend.`);
    console.log("--- [FIM DEBUG /api/search] ---");
    return NextResponse.json(results);

  } catch (error: any) {
    console.error("Erro 500: Catch na API de busca:", error.message);
    console.log("--- [FIM DEBUG /api/search] ---");
    return new NextResponse(JSON.stringify({ error: "Erro interno ao buscar filmes" }), { status: 500 });
  }
}