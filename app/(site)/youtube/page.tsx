import { prisma } from "@/lib/prisma";
import { getSocialItems } from "@/lib/data";
import { Youtube, ExternalLink, Play, Tv, Video, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const revalidate = 60;

export default async function YoutubePage() {
  const creator = await prisma.user.findFirst({ where: { role: "CREATOR" } });
  const rawVideos = await getSocialItems("YOUTUBE");

  const videos = rawVideos.map((item: any) => ({
    id: item.id,
    title: item.title || "Sem título",
    imageUrl: item.imageUrl,
    linkUrl: item.linkUrl,
    subtitle: item.subtitle || "Assista agora",
  }));

  // Separamos o Principal dos Secundários
  const mainChannel = {
    url: creator?.youtubeMainUrl,
    label: "Mah",
    desc: "Canal de Vlogs e Gameplay da Streamer MAH, conhecida pelo seu QI negativo",
    icon: <Youtube className="w-8 h-8 md:w-12 md:h-12 text-white" />,
    color: "from-red-600 to-red-900",
    btnColor: "bg-red-600 hover:bg-red-700"
  };

  const subChannels = [
    { 
      label: "Cine Mah", 
      url: creator?.youtubeSecondUrl, 
      icon: <Zap className="w-5 h-5" />, 
      color: "border-yellow-500/20 bg-yellow-500/5 hover:border-yellow-500/50",
      iconColor: "text-yellow-500",
      desc: "Conteúdos assistidos em Live"
    },
    { 
      label: "Mahnimes", 
      url: creator?.youtubeThirdUrl, 
      icon: <Tv className="w-5 h-5" />, 
      color: "border-purple-500/20 bg-purple-500/5 hover:border-purple-500/50",
      iconColor: "text-purple-500",
      desc: "Nerdola de Anime? Clique aquui!"
    },
    { 
      label: "Mah Moojen Cortes", 
      url: creator?.youtubeFourthUrl, 
      icon: <Video className="w-5 h-5" />, 
      color: "border-blue-500/20 bg-blue-500/5 hover:border-blue-500/50",
      iconColor: "text-blue-500",
      desc: "Cortes da live MahMoojen"
    },
  ].filter(c => c.url); // Remove os vazios

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-24 pb-20 overflow-x-hidden">
      
      {/* Background Decorativo */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-red-600/5 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 max-w-7xl">
        
        {/* --- TÍTULO DA PÁGINA --- */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
            Meus <span className="text-red-600">Canais</span>
          </h1>
          <p className="text-gray-400">Inscreva-se em todos para não perder nada.</p>
        </div>

        {/* --- 1. DESTAQUE: CANAL PRINCIPAL (HERO) --- */}
        {mainChannel.url && (
          <div className="relative w-full rounded-3xl overflow-hidden border border-red-500/20 mb-8 group">
            {/* Gradiente de Fundo */}
            <div className={`absolute inset-0 bg-gradient-to-br ${mainChannel.color} opacity-20 group-hover:opacity-30 transition-opacity duration-500`} />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
            
            <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-900/50 transform group-hover:scale-105 transition-transform duration-500">
                  {mainChannel.icon}
                </div>
                <div className="text-center md:text-left">
                  <Badge className="bg-red-500/20 text-red-200 border-red-500/30 mb-2 hover:bg-red-500/30">
                    O Principal
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {mainChannel.label}
                  </h2>
                  <p className="text-gray-300 max-w-md text-lg leading-relaxed">
                    {mainChannel.desc}
                  </p>
                </div>
              </div>

              <Button 
                asChild 
                size="lg" 
                className={`${mainChannel.btnColor} text-white font-bold h-14 px-8 rounded-xl shadow-lg shadow-red-900/30 transition-all hover:scale-105`}
              >
                <a href={mainChannel.url} target="_blank">
                  Inscrever-se Agora <ArrowRight className="ml-2 w-5 h-5" />
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* --- 2. GRID: CANAIS SECUNDÁRIOS --- */}
        {subChannels.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-20">
            {subChannels.map((channel, idx) => (
              <a 
                key={idx} 
                href={channel.url!} 
                target="_blank"
                className={`group flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${channel.color}`}
              >
                <div className={`p-3 rounded-xl bg-black/40 ${channel.iconColor} shadow-sm`}>
                  {channel.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    {channel.label}
                    <ExternalLink className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-sm text-gray-400 mt-1 leading-snug">
                    {channel.desc}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* --- 3. FEED DE VÍDEOS --- */}
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1 bg-red-600 rounded-full" />
            <h2 className="text-2xl font-bold">Últimos Lançamentos</h2>
          </div>

          {videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <a 
                  key={video.id} 
                  href={video.linkUrl} 
                  target="_blank"
                  className="group block"
                >
                  <Card className="bg-gray-900 border-gray-800 overflow-hidden hover:border-red-500/50 hover:shadow-[0_0_30px_-5px_rgba(220,38,38,0.2)] transition-all duration-300 h-full">
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={video.imageUrl}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 duration-300">
                        <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-all duration-300">
                          <Play className="w-6 h-6 text-white ml-1 fill-white" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Info */}
                    <CardContent className="p-5 relative">
                      <div className="absolute top-0 right-0 -mt-3 mr-4">
                         <Badge className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg">New</Badge>
                      </div>
                      <h3 className="font-bold text-white text-lg line-clamp-2 mb-2 group-hover:text-red-400 transition-colors">
                        {video.title}
                      </h3>
                      <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                        <Youtube className="w-3 h-3" /> {video.subtitle}
                      </p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-900/50 border border-dashed border-gray-800 rounded-2xl">
              <p className="text-gray-500">Nenhum vídeo adicionado ainda.</p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}