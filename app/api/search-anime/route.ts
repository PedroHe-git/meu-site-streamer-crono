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

  // Query GraphQL para a AniList
  const graphQLQuery = `
    query ($search: String) {
      Page(page: 1, perPage: 10) {
        media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
          idMal
          title {
            romaji
            english
            native
          }
          coverImage {
            large
          }
          startDate {
            year
          }
        }
      }
    }
  `;

  const url = "https://graphql.anilist.co";

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      query: graphQLQuery,
      variables: { search: query },
    }),
    next: { revalidate: 3600 } // Cache de 1 hora
  };

  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      throw new Error(`Erro AniList: ${res.status}`);
    }

    const data = await res.json();
    
    // Mapeia a resposta da AniList para o formato que seu front espera
    const results = data.data.Page.media.map((anime: any) => ({
      source: "ANIME",
      tmdbId: null,
      malId: anime.idMal || null, // AniList fornece o ID do MAL!
      title: anime.title.english || anime.title.romaji || anime.title.native,
      posterPath: anime.coverImage.large || null,
      releaseYear: anime.startDate.year || null,
    }));

    return NextResponse.json(results);

  } catch (error: any) {
    console.error("Erro na busca de Animes (AniList):", error.message);
    // Retorna lista vazia em vez de erro 500 para não quebrar a tela
    return NextResponse.json([]); 
  }
}