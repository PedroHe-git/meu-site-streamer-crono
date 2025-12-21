import  Header  from "@/app/components/portfolio/Header";
import { Footer } from "@/app/components/portfolio/Footer";
import { TwitchPlayer } from "@/app/components/portfolio/TwitchPlayer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CalendarDays, PlaySquare } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import LiveStatusIndicator from "@/app/components/LiveStatusIndicator";

export const revalidate = 3600;

async function getCreator() {
  const creator = await prisma.user.findFirst({
    where: { role: UserRole.CREATOR },
    select: {
      username: true,
      twitchUsername: true,
      profileBannerUrl: true,
    }
  });
  return creator;
}

export default async function Home() {
  const creator = await getCreator();
  const twitchChannel = creator?.twitchUsername || process.env.TWITCH_CHANNEL_NAME || "monstercat"; 

  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      
      {/* HERO SECTION */}
      <section className="relative flex-grow flex flex-col pt-24 pb-16 justify-center overflow-hidden">
        
        {/* Fundo com Banner (Borrado) */}
        {creator?.profileBannerUrl && (
          <div className="absolute inset-0 z-0">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-20 blur-sm scale-110"
              style={{ backgroundImage: `url(${creator.profileBannerUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950/80 via-gray-950/90 to-gray-950" />
          </div>
        )}

        <div className="container relative z-10 mx-auto px-4 flex flex-col items-center">
            
            {/* Status da Live */}
            <div className="mb-6 transform hover:scale-105 transition-transform duration-300">
               <LiveStatusIndicator 
                  twitchChannel={twitchChannel} 
                  className="text-sm px-4 py-2 shadow-[0_0_20px_rgba(145,70,255,0.3)] border border-white/10"
               />
            </div>

            {/* Player da Twitch */}
            <div className="w-full max-w-5xl aspect-video rounded-xl overflow-hidden shadow-2xl border border-gray-800 bg-black relative group">
                <TwitchPlayer 
                   channel={twitchChannel} 
                   offlineImage={creator?.profileBannerUrl} 
                />
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 opacity-20 blur-2xl group-hover:opacity-30 transition-opacity -z-10" />
            </div>
            
            {/* Botões de Ação (Apenas o Essencial) */}
            <div className="flex flex-wrap justify-center gap-6 mt-10">
               <Button size="lg" asChild className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20 font-bold h-14 px-8 text-lg">
                 <Link href="/cronograma">
                   <CalendarDays className="w-6 h-6"/> Ver Programação
                 </Link>
               </Button>
               
               <Button size="lg" variant="outline" asChild className="gap-2 border-gray-700 bg-gray-900/80 hover:bg-gray-800 text-gray-200 h-14 px-8 text-lg hover:border-purple-500/50 transition-colors">
                 <Link href="/historico">
                   <PlaySquare className="w-6 h-6"/> Últimos Vídeos
                 </Link>
               </Button>
            </div>
            
        </div>
      </section>

      <Footer />
    </main>
  );
}