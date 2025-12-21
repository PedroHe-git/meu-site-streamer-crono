import { NextResponse } from "next/server";

// Define a estrutura de dados que o nosso frontend espera
type Video = {
  id: string; // ID do vídeo do YouTube
  title: string;
  thumbnail: string;
  views: string;
  duration: string;
};

// --- Funções Auxiliares para formatar os dados ---

/** Formata a duração ISO 8601 (ex: "PT1M35S") para "1:35" */
function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const sStr = s < 10 ? `0${s}` : `${s}`;
  const mStr = m < 10 && h > 0 ? `0${m}` : `${m}`;

  if (h > 0) {
    return `${h}:${mStr}:${sStr}`;
  } else {
    return `${m}:${sStr}`;
  }
}

/** Formata visualizações (ex: 123456) para "123K" */
function formatViews(views: string): string {
  const num = parseInt(views);
  if (num > 999999) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num > 999) {
    return (num / 1000).toFixed(0) + "K";
  }
  return `${num}`;
}

// --- A API Route Principal ---

export async function GET() {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
  const MAX_RESULTS = 6; // Quantos vídeos buscar

  if (!API_KEY || !CHANNEL_ID) {
    return new NextResponse(
      JSON.stringify({ error: "Chave de API ou ID do Canal não configurados" }),
      { status: 500 }
    );
  }

  try {
    // CHAMADA 1: Encontrar a playlist de "Uploads" do canal
    // (Cache de 1 dia, pois isso nunca muda)
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`;
    const channelResponse = await fetch(channelUrl, {
      next: { revalidate: 86400 },
    });
    if (!channelResponse.ok) throw new Error("Falha ao buscar canal");
    const channelData = await channelResponse.json();
    const uploadsId =
      channelData.items[0].contentDetails.relatedPlaylists.uploads;

    // CHAMADA 2: Buscar os vídeos mais recentes da playlist de "Uploads"
    // (Cache de 1 hora)
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&key=${API_KEY}&maxResults=${MAX_RESULTS}`;
    const playlistResponse = await fetch(playlistUrl, {
      next: { revalidate: 3600 },
    });
    if (!playlistResponse.ok) throw new Error("Falha ao buscar playlist");
    const playlistData = await playlistResponse.json();

    // Extrair os IDs dos vídeos
    const videoIds = playlistData.items
      .map((item: any) => item.snippet.resourceId.videoId)
      .join(",");

    // CHAMADA 3: Buscar os detalhes completos (views, duração) de todos os vídeos de uma vez
    // (Cache de 1 hora)
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${API_KEY}`;
    const videosResponse = await fetch(videosUrl, {
      next: { revalidate: 3600 },
    });
    if (!videosResponse.ok) throw new Error("Falha ao buscar detalhes dos vídeos");
    const videosData = await videosResponse.json();

    // Transformar a resposta final no formato que nosso frontend espera
    const videos: Video[] = videosData.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
      views: formatViews(item.statistics.viewCount),
      duration: formatDuration(item.contentDetails.duration),
    }));

    return NextResponse.json(videos);
  } catch (error) {
    console.error(error);
    return new NextResponse(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500 }
    );
  }
}