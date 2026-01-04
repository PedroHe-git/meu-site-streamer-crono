import { prisma } from "@/lib/prisma";
import { 
  BarChart3, Eye, Youtube, Twitch, Instagram, MapPin, 
  RefreshCw, Video 
} from "lucide-react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const revalidate = 0; // Sempre dados frescos

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) redirect("/");

  // 1. Busca Usuário + Canais do YouTube
  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email },
    include: { youtubeChannels: true } 
  });

  if (!user || user.role !== "CREATOR") redirect("/");

  // Formatador Numérico (Ex: 1.5M ou 1.500)
  const format = (n: number | bigint | null) => {
    if (!n) return "0";
    return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(Number(n));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-10 pb-20">
      
      {/* --- CABEÇALHO --- */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
              <BarChart3 className="text-purple-500 w-8 h-8" /> 
              Métricas Sociais
            </h1>
            <p className="text-gray-400 text-sm mt-1">
                Acompanhamento consolidado das suas redes (YouTube, Twitch, Instagram).
            </p>
        </div>

        <div className="flex items-center gap-3">
            {/* Botão de Sincronização Mantido (Essencial para atualizar o YouTube/Twitch) */}
            <Button variant="outline" asChild className="border-purple-500/30 hover:bg-purple-500/20 text-purple-300">
                <Link href={`/api/cron/stats?key=${process.env.CRON_SECRET}`} target="_blank">
                    <RefreshCw className="mr-2 h-4 w-4" /> Sincronizar Agora
                </Link>
            </Button>
        </div>
      </div>

      {/* --- SEÇÃO 1: REDES SOCIAIS (Overview) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card Twitch */}
        <div className="bg-purple-950/10 border border-purple-500/20 p-6 rounded-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Twitch size={80} />
           </div>
           <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><Twitch size={20} /></div>
             <span className="font-bold text-gray-200">Twitch</span>
           </div>
           <div className="space-y-1">
             <div className="text-3xl font-black text-white">{format(user.twitchFollowersCount)}</div>
             <p className="text-xs text-purple-300/60 uppercase font-bold tracking-wider">Seguidores</p>
           </div>
           <div className="mt-4 pt-4 border-t border-purple-500/20 flex justify-between items-center">
              <span className="text-xs text-gray-400">Total Views</span>
              <span className="font-mono text-white">{format(user.twitchTotalViews)}</span>
           </div>
        </div>

        {/* Card Instagram */}
        <div className="bg-pink-950/10 border border-pink-500/20 p-6 rounded-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Instagram size={80} />
           </div>
           <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400"><Instagram size={20} /></div>
             <span className="font-bold text-gray-200">Instagram</span>
           </div>
           <div className="space-y-1">
             <div className="text-3xl font-black text-white">{format(user.instagramFollowersCount)}</div>
             <p className="text-xs text-pink-300/60 uppercase font-bold tracking-wider">Seguidores (manual)</p>
           </div>
           <div className="mt-4 pt-4 border-t border-pink-500/20 flex justify-between items-center">
              <span className="text-xs text-gray-400">Região Base</span>
              <span className="font-mono text-white flex items-center gap-1">
                <MapPin size={12} /> {user.statRegion || "BR"}
              </span>
           </div>
        </div>

        {/* Card YouTube (Agregado) */}
        <div className="bg-red-950/10 border border-red-500/20 p-6 rounded-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Youtube size={80} />
           </div>
           <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-red-500/20 rounded-lg text-red-400"><Youtube size={20} /></div>
             <span className="font-bold text-gray-200">YouTube (Total)</span>
           </div>
           <div className="space-y-1">
             <div className="text-3xl font-black text-white">{format(user.youtubeSubsCount)}</div>
             <p className="text-xs text-red-300/60 uppercase font-bold tracking-wider">Inscritos da Rede</p>
           </div>
           <div className="mt-4 pt-4 border-t border-red-500/20 flex justify-between items-center text-xs">
              <span className="text-gray-400 flex items-center gap-1"><Eye size={12}/> {format(user.youtubeViewsCount)} Views</span>
              <span className="text-gray-400 flex items-center gap-1"><Video size={12}/> {format(user.youtubeVideoCount)} Vídeos</span>
           </div>
        </div>
      </div>

      {/* --- SEÇÃO 2: DETALHAMENTO DE CANAIS YOUTUBE --- */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Youtube className="text-red-500" /> Canais Youtube
        </h2>
        
        {user.youtubeChannels.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-gray-500">
                Nenhum canal sincronizado individualmente.
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {user.youtubeChannels.sort((a,b) => b.subs - a.subs).map((channel) => (
                    <div key={channel.id} className="bg-black/40 border border-white/5 hover:border-red-500/30 transition-colors rounded-xl p-4 flex flex-col justify-between h-full">
                        <div>
                            <h3 className="font-bold text-white truncate mb-1" title={channel.title || "Canal"}>
                                {channel.title || "Canal Sem Nome"}
                            </h3>
                            <div className="text-2xl font-bold text-white mb-2">{format(channel.subs)} <span className="text-xs font-normal text-gray-500">subs</span></div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5">
                            <div className="text-xs">
                                <span className="block text-gray-500 mb-1">Views</span>
                                <span className="font-mono text-gray-300">{format(channel.views)}</span>
                            </div>
                            <div className="text-xs">
                                <span className="block text-gray-500 mb-1">Vídeos</span>
                                <span className="font-mono text-gray-300">{format(channel.videos)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
      
    </div>
  );
}