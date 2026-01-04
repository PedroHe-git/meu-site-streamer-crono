import { prisma } from "@/lib/prisma";
import { Youtube, Twitch } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function MediaKit() {
  const user = await prisma.user.findFirst({
    where: { role: "CREATOR" },
    include: { youtubeChannels: true } // 👈 Agora buscamos os canais individuais
  });

  if (!user) return null;

  const format = (n: number | bigint | null) => {
    if (!n) return "0";
    return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(Number(n));
  };

  // Ordena canais por inscritos (maior para menor)
  const channels = user.youtubeChannels.sort((a, b) => b.subs - a.subs);

  return (
    <section className="py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Bloco YouTube com Abas */}
        <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-600 rounded-lg text-white">
              <Youtube className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-lg">YouTube</h4>
              <p className="text-red-400 text-xs uppercase font-bold tracking-wider">Rede de Canais</p>
            </div>
          </div>
          
          <Tabs defaultValue="total" className="w-full">
            <TabsList className="bg-red-950/40 mb-4 w-full justify-start overflow-x-auto">
              <TabsTrigger value="total">Total</TabsTrigger>
              {channels.map(ch => (
                 <TabsTrigger key={ch.id} value={ch.id}>{ch.title?.split(' ')[0] || "Canal"}</TabsTrigger>
              ))}
            </TabsList>

            {/* Aba TOTAL */}
            <TabsContent value="total" className="mt-0">
               <div className="grid grid-cols-3 gap-4 text-center animate-in fade-in">
                <div>
                  <div className="text-2xl font-black text-white">{format(user.youtubeSubsCount)}</div>
                  <div className="text-xs text-gray-500">Inscritos</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{format(user.youtubeViewsCount)}</div>
                  <div className="text-xs text-gray-500">Views</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{format(user.youtubeVideoCount)}</div>
                  <div className="text-xs text-gray-500">Vídeos</div>
                </div>
              </div>
            </TabsContent>

            {/* Abas Individuais */}
            {channels.map(ch => (
              <TabsContent key={ch.id} value={ch.id} className="mt-0">
                <div className="grid grid-cols-3 gap-4 text-center animate-in fade-in">
                  <div>
                    <div className="text-2xl font-black text-white">{format(ch.subs)}</div>
                    <div className="text-xs text-gray-500">Inscritos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white">{format(ch.views)}</div>
                    <div className="text-xs text-gray-500">Views</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white">{format(ch.videos)}</div>
                    <div className="text-xs text-gray-500">Vídeos</div>
                  </div>
                </div>
                <p className="text-center text-xs text-red-300/50 mt-4">{ch.title}</p>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Bloco Twitch (Mantido Igual) */}
        <div className="bg-purple-950/20 border border-purple-900/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-600 rounded-lg text-white">
              <Twitch className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-lg">Twitch</h4>
              <p className="text-purple-400 text-xs uppercase font-bold tracking-wider">Ao Vivo</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-black text-white">{format(user.twitchFollowersCount)}</div>
              <div className="text-xs text-gray-500">Seguidores</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">{format(user.twitchTotalViews)}</div>
              <div className="text-xs text-gray-500">Views do Canal</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}