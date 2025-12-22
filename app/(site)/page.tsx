import Image from "next/image";
import Link from "next/link";
import { Play, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TwitchPlayer from "@/app/components/portfolio/TwitchPlayer";
import Header from "@/app/components/portfolio/Header";
import Footer from "@/app/components/portfolio/Footer";
import { getTwitchStatus } from "@/lib/twitch"; // 👈 Importamos a nova função

// Cache da página inteira por 60 segundos para não estourar limite da Twitch
export const revalidate = 60;

export default async function HomePage() {
  // Chamamos a função diretamente (sem fetch interno)
  const { isLive, viewer_count, title, game_name } = await getTwitchStatus();
  
  const TWITCH_USERNAME = "MahMoojen"; 

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-purple-500/30 flex flex-col">
      <Header />
      
      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden flex-grow">
        
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-pink-900/10 blur-[100px] rounded-full pointer-events-none" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* Texto (Esquerda) */}
            <div className="flex-1 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <span className={`relative flex h-3 w-3`}>
                  {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${isLive ? 'bg-red-500' : 'bg-gray-500'}`}></span>
                </span>
                <span className="text-xs font-medium tracking-wider text-gray-300 uppercase">
                  {isLive ? "Ao Vivo Agora" : "Atualmente Offline"}
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1]">
                BEM VINDO AO <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 animate-gradient-x">
                  MAHMOOJEN
                </span>
              </h1>

              <p className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Gameplay de alta qualidade, resenha e momentos épicos. 
                Junte-se à comunidade mais caótica e divertida da Twitch.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                <Button asChild size="lg" className="h-14 px-8 text-lg bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-900/20 rounded-xl transition-all hover:scale-105">
                  <a href={`https://twitch.tv/${TWITCH_USERNAME}`} target="_blank" rel="noopener noreferrer">
                    <Play className="mr-2 h-5 w-5 fill-current" /> Assistir na Twitch
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg border-white/10 bg-white/5 hover:bg-white/10 rounded-xl backdrop-blur-md transition-all hover:scale-105">
                  <Link href="/cronograma">
                    Ver Cronograma
                  </Link>
                </Button>
              </div>

              {/* Stats Rápidos */}
              <div className="flex items-center justify-center lg:justify-start gap-8 pt-8 border-t border-white/5">
                <div>
                  <p className="text-2xl font-bold text-white">65K+</p>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Seguidores</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">1,2k+</p>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Mídias Assistidas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">BR</p>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Região</p>
                </div>
              </div>
            </div>

            {/* PLAYER (Direita) */}
            <div className="flex-1 w-full max-w-2xl lg:max-w-none">
              <div className="relative group">
                {isLive && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-60 transition duration-1000 animate-pulse-slow"></div>
                )}
                
                <div className="relative aspect-video rounded-2xl bg-black border border-white/10 shadow-2xl overflow-hidden">
                  {isLive ? (
                    <TwitchPlayer username={TWITCH_USERNAME} isLive={true} />
                  ) : (
                    // Estado Offline
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-[url('/images/banner-offline.jpg')] bg-cover bg-center">
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
                      <div className="relative z-10 text-center space-y-4 p-6">
                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20">
                          <Radio className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Stream Offline</h3>
                        <p className="text-gray-400 max-w-md">
                          Não estamos ao vivo no momento. Confira o cronograma ou assista aos VODs.
                        </p>
                        <Button variant="secondary" className="mt-4" asChild>
                           <Link href="/historico">Assistir VODs Antigos</Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {isLive && (
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[90%] bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center justify-between shadow-xl z-20">
                    <div className="flex flex-col">
                      <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">{game_name || "Ao Vivo"}</span>
                      <span className="text-sm font-medium text-white line-clamp-1">{title || "Stream da MahMoojen"}</span>
                    </div>
                    <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 flex gap-2 shrink-0">
                       <Radio className="w-3 h-3" /> {viewer_count || 0}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}