export async function getYoutubeStats(channelId: string) {
  if (!process.env.YOUTUBE_API_KEY) return null;

  try {
    // Adicionei "snippet" na busca para pegar o título
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${process.env.YOUTUBE_API_KEY}`,
      { next: { revalidate: 3600 } }
    );
    
    const data = await res.json();
    const item = data.items?.[0];
    
    if (!item) return null;

    return {
      title: item.snippet.title, // 👈 Nome do canal
      subs: parseInt(item.statistics.subscriberCount),
      views: parseInt(item.statistics.viewCount),
      videos: parseInt(item.statistics.videoCount)
    };
  } catch (error) {
    console.error(`Erro YouTube Stats (${channelId}):`, error);
    return null;
  }
}