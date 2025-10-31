// app/api/search-series/route.ts

import { NextResponse, NextRequest } from 'next/server';

export const runtime = 'nodejs';

// Não precisamos mais do 'date-fns' aqui, o frontend já cuida disso
// import { parseISO, getYear } from 'date-fns';

export async function GET(request: NextRequest) {
  const tmdbApiKey = process.env.TMDB_API_KEY;
  if (!tmdbApiKey) {
    return NextResponse.json(
      { error: 'Chave da API do TMDB não configurada' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json(
      { error: 'Termo de busca (query) é obrigatório' },
      { status: 400 }
    );
  }

  try {
    const tmdbUrl = `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(
      query
    )}&language=pt-BR&include_adult=false`;

    // Autenticação Bearer Token (igual à sua API de filmes)
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${tmdbApiKey}`,
      },
    };

    const res = await fetch(tmdbUrl, options);

    if (!res.ok) {
      const errorDetails = await res.json();
      console.error("Erro detalhado do TMDB (/api/search-series):", errorDetails);
      throw new Error(`Falha ao buscar no TMDB: ${errorDetails.status_message || res.statusText}`);
    }

    const data = await res.json();

    // --- [MUDANÇA PRINCIPAL AQUI] ---
    // Retornamos 'data.results' (dados brutos),
    // exatamente como sua API de filmes /api/search/route.ts faz.
    // O seu componente MediaSearch.tsx vai cuidar da formatação.
    return NextResponse.json(data.results);

  } catch (error) {
    console.error('Erro na API /api/search-series:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}