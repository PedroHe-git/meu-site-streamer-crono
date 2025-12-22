"use client";

import { useRef } from "react"; // 👈 Importar useRef
import { Youtube, Instagram, Play, ArrowUpRight, Zap, Tv, Video, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image"; 
import Autoplay from "embla-carousel-autoplay"; // 👈 Importar o plugin
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type SocialItem = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  subtitle: string;
};

type ChannelInfo = {
  label: string;
  url: string | null;
  type: "MAIN" | "CLIPS" | "LIVES" | "EXTRAS";
};

interface SocialCarouselProps {
  ytItems: SocialItem[];
  instaItems: SocialItem[];
  youtubeChannels: ChannelInfo[];
  instaProfileUrl: string;
}

export default function SocialCarousel({ 
  ytItems, 
  instaItems, 
  youtubeChannels,
  instaProfileUrl 
}: SocialCarouselProps) {

  // 👇 Configuração do Autoplay (4000ms = 4 segundos)
  const plugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  const getChannelStyle = (type: string) => {
    switch (type) {
      case "MAIN": return { 
        bgHover: "hover:bg-red-950/30", 
        borderHover: "hover:border-red-500/50",
        iconBg: "bg-red-500/10 text-red-500",
        glow: "group-hover:shadow-[0_0_20px_-5px_rgba(220,38,38,0.3)]"
      };
      case "CLIPS": return { 
        bgHover: "hover:bg-yellow-950/30", 
        borderHover: "hover:border-yellow-500/50",
        iconBg: "bg-yellow-500/10 text-yellow-500",
        glow: "group-hover:shadow-[0_0_20px_-5px_rgba(234,179,8,0.3)]"
      };
      case "LIVES": return { 
        bgHover: "hover:bg-purple-950/30", 
        borderHover: "hover:border-purple-500/50",
        iconBg: "bg-purple-500/10 text-purple-500",
        glow: "group-hover:shadow-[0_0_20px_-5px_rgba(168,85,247,0.3)]"
      };
      case "EXTRAS": return { 
        bgHover: "hover:bg-blue-950/30", 
        borderHover: "hover:border-blue-500/50",
        iconBg: "bg-blue-500/10 text-blue-500",
        glow: "group-hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]"
      };
      default: return { bgHover: "", borderHover: "", iconBg: "", glow: "" };
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
        case "MAIN": return <Youtube className="w-5 h-5" />;
        case "CLIPS": return <Zap className="w-5 h-5" />;
        case "LIVES": return <Tv className="w-5 h-5" />;
        case "EXTRAS": return <Video className="w-5 h-5" />;
        default: return <Youtube className="w-5 h-5" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-7xl mx-auto items-start">
      
      {/* ESQUERDA: YOUTUBE */}
      <div className="flex flex-col gap-6 h-full">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[80px] rounded-full pointer-events-none" />

            <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="bg-gradient-to-br from-red-600 to-red-800 p-3 rounded-xl shadow-lg shadow-red-900/20 text-white">
                    <Youtube className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="font-bold text-2xl text-white tracking-tight">Canais YouTube</h2>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Selecione para assistir</p>
                </div>
            </div>

            {youtubeChannels.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                    {youtubeChannels.map((channel, idx) => {
                        const style = getChannelStyle(channel.type);
                        if (!channel.url) return null;

                        return (
                            <a 
                                key={idx} 
                                href={channel.url} 
                                target="_blank" 
                                className={cn(
                                    "group flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] transition-all duration-300",
                                    style.bgHover,
                                    style.borderHover
                                )}
                            >
                                <div className={cn(
                                    "p-2.5 rounded-lg transition-transform duration-300 group-hover:scale-110",
                                    style.iconBg,
                                    style.glow
                                )}>
                                    {getIcon(channel.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider group-hover:text-white/70 transition-colors">
                                        {channel.type === "MAIN" ? "Oficial" : channel.label}
                                    </span>
                                    <h4 className="font-semibold text-gray-200 text-sm truncate group-hover:text-white flex items-center gap-1">
                                        Ir para canal <ArrowUpRight className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                                    </h4>
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-1 h-5 bg-red-600 rounded-full inline-block" />
                    Últimos Vídeos
                </h3>
            </div>

            {ytItems.length > 0 ? (
                // 👇 AQUI APLICAMOS O PLUGIN E OS EVENTOS DE MOUSE
                <Carousel 
                    opts={{ align: "start", loop: true }} 
                    plugins={[plugin.current]}
                    className="w-full mt-auto"
                    onMouseEnter={plugin.current.stop}
                    onMouseLeave={plugin.current.reset}
                >
                    <CarouselContent className="-ml-4">
                    {ytItems.map((item) => (
                        <CarouselItem key={item.id} className="pl-4 basis-11/12 sm:basis-1/2">
                        <a href={item.linkUrl} target="_blank" className="group block h-full">
                            <div className="bg-gray-900/50 border border-white/5 rounded-xl overflow-hidden hover:border-red-500/30 transition-all duration-300 h-full hover:-translate-y-1 hover:shadow-lg hover:shadow-red-900/10">
                                <div className="relative aspect-video">
                                    {item.imageUrl ? (
                                      <Image 
                                        src={item.imageUrl} 
                                        alt={item.title} 
                                        fill 
                                        unoptimized={true}
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" 
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gray-800" />
                                    )}
                                    
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                        <div className="w-10 h-10 bg-red-600/90 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm scale-90 opacity-80 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                                            <Play className="w-4 h-4 text-white ml-0.5 fill-white" />
                                        </div>
                                    </div>
                                    
                                    <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
                                        VÍDEO
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h3 className="font-bold text-gray-200 text-sm line-clamp-2 group-hover:text-red-400 transition-colors leading-snug">
                                        {item.title}
                                    </h3>
                                    <p className="text-[11px] text-gray-500 mt-2 font-medium">
                                        {item.subtitle || "Assistir agora"}
                                    </p>
                                </div>
                            </div>
                        </a>
                        </CarouselItem>
                    ))}
                    </CarouselContent>
                    <div className="flex justify-end gap-2 mt-4">
                        <CarouselPrevious className="static translate-y-0 h-8 w-8 bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700" />
                        <CarouselNext className="static translate-y-0 h-8 w-8 bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700" />
                    </div>
                </Carousel>
            ) : (
                <div className="flex-1 flex items-center justify-center border border-dashed border-white/10 rounded-xl p-8">
                    <p className="text-gray-500 text-sm">Nenhum vídeo encontrado</p>
                </div>
            )}
        </div>
      </div>

      {/* DIREITA: INSTAGRAM */}
      <div className="h-full bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col">
        
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-purple-900/5 via-transparent to-transparent pointer-events-none" />

        <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
                <div className="relative p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-full">
                    <div className="bg-black p-2 rounded-full">
                        <Instagram className="w-5 h-5 text-white" />
                    </div>
                </div>
                <div>
                    <h2 className="font-bold text-xl text-white">Instagram</h2>
                    <p className="text-xs text-gray-400">@mahmoojen</p>
                </div>
            </div>
            <Button size="sm" className="bg-white text-black hover:bg-gray-200 font-bold rounded-full px-6 h-8 text-xs" asChild>
                <a href={instaProfileUrl} target="_blank">Seguir</a>
            </Button>
        </div>

        <div className="flex-1 relative z-10">
             {instaItems.length > 0 ? (
                <Carousel opts={{ align: "start", loop: true }} className="w-full">
                    <CarouselContent className="-ml-3">
                    {instaItems.map((item) => (
                        <CarouselItem key={item.id} className="pl-3 basis-1/2 sm:basis-1/3">
                        <a href={item.linkUrl} target="_blank" className="group block h-full">
                            <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-gray-900 border border-white/5 hover:border-pink-500/40 transition-all duration-300">
                                {item.imageUrl ? (
                                  <Image 
                                    src={item.imageUrl} 
                                    alt={item.title} 
                                    fill 
                                    unoptimized={true} 
                                    sizes="(max-width: 768px) 50vw, 33vw"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-800" />
                                )}
                                
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                                    <Heart className="w-6 h-6 text-white fill-white mb-2 animate-bounce" />
                                    <p className="text-[10px] text-gray-300 font-medium line-clamp-2">
                                        {item.title}
                                    </p>
                                </div>
                            </div>
                        </a>
                        </CarouselItem>
                    ))}
                    </CarouselContent>
                    <div className="flex justify-center mt-6">
                        <div className="flex gap-2">
                            <CarouselPrevious className="static translate-y-0 h-8 w-8 bg-gray-800 border-gray-700 hover:bg-pink-600/20 hover:text-pink-500" />
                            <CarouselNext className="static translate-y-0 h-8 w-8 bg-gray-800 border-gray-700 hover:bg-pink-600/20 hover:text-pink-500" />
                        </div>
                    </div>
                </Carousel>
            ) : (
                <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-xl">
                    <p className="text-gray-500 text-sm">Feed vazio</p>
                </div>
            )}
        </div>

        <div className="mt-8 pt-4 border-t border-white/5 text-center">
            <p className="text-xs text-gray-500">
                Acompanhe os stories para atualizações diárias.
            </p>
        </div>

      </div>

    </div>
  );
}