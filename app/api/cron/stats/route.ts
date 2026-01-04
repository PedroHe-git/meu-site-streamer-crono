import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTwitchChannelStats } from "@/lib/twitch";
import { getYoutubeStats } from "@/lib/youtube";

const TWITCH_ID = "544241532"; 

const YOUTUBE_IDS = [
  "UCOLi64s3Br_QwETBrT25VRw", 
  "UCFu3P06b4-WUBvqjncA-nCA", 
  "UCdfAq743YxDtyj1O5GrtO9w", 
  "UCczWKluV6307eRV2W3Z51Iw"  
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("key") !== process.env.CRON_SECRET) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Busca o Usuário Criador (precisamos do ID dele para ligar os canais)
    const creator = await prisma.user.findFirst({ where: { role: "CREATOR" } });
    if (!creator) return NextResponse.json({ error: "Criador não encontrado" }, { status: 404 });

    // 2. Twitch
    const twitchStats = await getTwitchChannelStats(TWITCH_ID);

    // 3. YouTube (Loop Avançado)
    let totalSubs = 0;
    let totalViews = 0;
    let totalVideos = 0;

    for (const channelId of YOUTUBE_IDS) {
        const stats = await getYoutubeStats(channelId);
        
        if (stats) {
            // A. Salva/Atualiza o canal individualmente
            await prisma.youtubeChannel.upsert({
                where: { channelId: channelId },
                update: {
                    title: stats.title,
                    subs: stats.subs,
                    views: stats.views,
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

            // B. Soma para o total
            totalSubs += stats.subs;
            totalViews += stats.views;
            totalVideos += stats.videos;
        }
    }

    // 4. Atualiza os Totais no User (para a Home)
    const dataToUpdate: any = {
      lastStatsUpdate: new Date(),
      youtubeSubsCount: totalSubs,
      youtubeViewsCount: totalViews,
      youtubeVideoCount: totalVideos,
      twitchFollowersCount: twitchStats?.followers || 0,
    };

    if (twitchStats?.totalViews && twitchStats.totalViews > 0) {
      dataToUpdate.twitchTotalViews = twitchStats.totalViews;
    }

    await prisma.user.update({
      where: { id: creator.id },
      data: dataToUpdate
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}