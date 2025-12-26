"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Users, Gamepad2, Play } from "lucide-react"; // Troquei o ícone para Play (mais clean)
import { Skeleton } from "@/components/ui/skeleton";

interface TwitchPlayerProps {
  channel?: string;
  className?: string;
}

interface StreamData {
  isLive: boolean;
  liveTitle?: string;
  gameName?: string;
  viewerCount?: number;
  thumbnailUrl?: string;
}

export default function TwitchPlayer({ channel, className }: TwitchPlayerProps) {
  const channelName = channel || process.env.NEXT_PUBLIC_TWITCH_CHANNEL_NAME || "mahmoojen";
  
  const [data, setData] = useState<StreamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const channelUrl = `https://twitch.tv/${channelName}`;

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/twitch/status?channel=${channelName}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Erro Twitch:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [channelName]);

  if (isLoading) {
    return (
      <div className={cn("relative w-full aspect-video rounded-xl overflow-hidden bg-gray-900 border border-gray-800", className)}>
         <Skeleton className="w-full h-full bg-gray-800/50" />
      </div>
    );
  }

  // Estado OFFLINE (Mantive igual, mas mais clean)
  if (!data?.isLive) {
    return (
      <a 
        href={channelUrl}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "group relative w-full aspect-video flex flex-col items-center justify-center bg-[#0a0a0a] rounded-xl overflow-hidden border border-gray-800 transition-all hover:border-purple-500/30", 
          className
        )}
      >
         <div className="absolute inset-0 bg-[url('/poster-placeholder.png')] bg-cover bg-center opacity-10 grayscale" />
         <div className="z-10 flex flex-col items-center gap-2">
            <div className="p-3 bg-gray-900 rounded-full border border-gray-800 text-gray-500 group-hover:text-purple-400 group-hover:border-purple-500/50 transition-colors">
                <Gamepad2 className="w-6 h-6" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Offline no momento</p>
         </div>
      </a>
    );
  }

  // Estado ONLINE (Novo Visual Clean)
  return (
    <a 
      href={channelUrl}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group relative w-full aspect-video block bg-black rounded-xl overflow-hidden border border-gray-800 shadow-xl transition-all hover:border-purple-500/50 hover:shadow-purple-500/20", 
        className
      )}
    >
      {/* 1. IMAGEM (Limpa por padrão, zoom no hover) */}
      {data.thumbnailUrl ? (
        <Image 
          src={data.thumbnailUrl} 
          alt={data.liveTitle || "Live"} 
          fill
          key={data.thumbnailUrl}
          className="object-cover opacity-100 transition-transform duration-700 group-hover:scale-105"
          unoptimized={true}
        />
      ) : (
        <div className="absolute inset-0 bg-gray-900" />
      )}

      {/* 2. OVERLAY DE AÇÃO (Invisível -> Visível no Hover) */}
      <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/60 backdrop-blur-[2px]">
          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-purple-600/30">
                  <Play className="w-6 h-6 ml-1 fill-white" />
              </div>
              <span className="text-white font-bold text-sm tracking-wide uppercase">Assistir Agora</span>
          </div>
      </div>

      {/* 3. INFO BAR (Sempre visível no rodapé, com gradiente para leitura) */}
      <div className="absolute bottom-0 left-0 w-full p-4 z-30 bg-gradient-to-t from-black via-black/80 to-transparent pt-12">
         <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
                {data.gameName && (
                  <p className="text-purple-400 text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate">
                      {data.gameName}
                  </p>
                )}
                <h3 className="text-white font-bold text-base md:text-lg line-clamp-1 leading-tight group-hover:text-purple-200 transition-colors">
                    {data.liveTitle || "Transmissão ao Vivo"}
                </h3>
            </div>
         </div>
      </div>

      {/* 4. BADGES (Topo Esquerdo) */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-30">
        <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded animate-pulse shadow-lg shadow-red-600/20">
          AO VIVO
        </span>
        {data.viewerCount !== undefined && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-black/50 backdrop-blur-md border border-white/10 text-gray-200 text-[10px] font-medium rounded">
            <Users className="w-3 h-3 text-red-400" />
            {data.viewerCount.toLocaleString()}
          </span>
        )}
      </div>
    </a>
  );
}