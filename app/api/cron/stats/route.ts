import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTwitchChannelStats } from "@/lib/twitch";
import { getYoutubeStats } from "@/lib/youtube";

// SEUS IDs REAIS
const TWITCH_ID = "544241532"; 

const YOUTUBE_IDS = [
  "UCOLi64s3Br_QwETBrT25VRw", // mahcetou (Principal)
  "UCFu3P06b4-WUBvqjncA-nCA", // mahnimes
  "UCdfAq743YxDtyj1O5GrtO9w", // mahmoojenlives
  "UCczWKluV6307eRV2W3Z51Iw"  // cine-mah 
];

export async function GET(request: Request) {
  // --- 1. SEGURANÇA (Compatível com Vercel Cron) ---
  const authHeader = request.headers.get('authorization');
  
  // Verifica se o Header tem "Bearer SUA_SENHA" 
  // OU se a URL tem "?key=SUA_SENHA" (fallback para teste manual no navegador)
  const { searchParams } = new URL(request.url);
  const queryKey = searchParams.get("key");

  const isHeaderValid = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const isQueryValid = queryKey === process.env.CRON_SECRET;

  if (!isHeaderValid && !isQueryValid) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Busca o Usuário Criador (precisamos do ID dele para ligar os canais)
    const creator = await prisma.user.findFirst({ where: { role: "CREATOR" } });
    if (!creator) return NextResponse.json({ error: "Criador não encontrado" }, { status: 404 });

    // 3. Coleta dados da Twitch (Único canal)
    const twitchStats = await getTwitchChannelStats(TWITCH_ID);

    // 4. Coleta e Processa YouTube (Múltiplos canais)
    let totalSubs = 0;
    let totalViews = 0;
    let totalVideos = 0;
    const youtubeResults = [];

    for (const channelId of YOUTUBE_IDS) {
        // Pega dados da API
        const stats = await getYoutubeStats(channelId);
        
        if (stats) {
            // A. Salva/Atualiza o canal individualmente na tabela nova
            const channelRecord = await prisma.youtubeChannel.upsert({
                where: { channelId: channelId },
                update: {
                    title: stats.title,
                    subs: stats.subs,
                    views: stats.views, // Salva como BigInt
                    videos: stats.videos,
                    updatedAt: new Date()
                },
                create: {
                    channelId: channelId,
                    userId: creator.id,
                    title: stats.title,
                    subs: stats.subs,
                    views: stats.views,
                    videos: stats.videos
                }
            });
            youtubeResults.push(channelRecord);

            // B. Soma para o total
            totalSubs += stats.subs;
            totalViews += stats.views;
            totalVideos += stats.videos;
        }
    }

    // 5. Atualiza os Totais no User (para a Home e cálculos rápidos)
    const dataToUpdate: any = {
      lastStatsUpdate: new Date(),
      
      // Totais somados do YouTube
      youtubeSubsCount: totalSubs,
      youtubeViewsCount: totalViews,
      youtubeVideoCount: totalVideos,
      
      // Twitch
      twitchFollowersCount: twitchStats?.followers || 0,
    };

    // Só atualiza as views da Twitch se vier maior que 0 (Proteção contra API bugada)
    if (twitchStats?.totalViews && twitchStats.totalViews > 0) {
      dataToUpdate.twitchTotalViews = twitchStats.totalViews;
    }

    await prisma.user.update({
      where: { id: creator.id },
      data: dataToUpdate
    });

    // Retorno da API (O global BigInt.toJSON resolve a serialização aqui)
    return NextResponse.json({ 
        success: true,
        summary: {
            twitchFollowers: twitchStats?.followers,
            youtubeTotalSubs: totalSubs,
            youtubeTotalViews: totalViews
        },
        details: youtubeResults
    });

  } catch (error) {
    console.error("Erro CRON Stats:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}