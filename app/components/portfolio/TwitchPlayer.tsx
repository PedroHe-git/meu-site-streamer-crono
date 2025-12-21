"use client";

import { useEffect, useState } from "react";
import { Loader2, Twitch, Play, Users, Gamepad2 } from "lucide-react"; // Adicionei ícones novos
import { Button } from "@/components/ui/button";

interface TwitchPlayerProps {
  channel: string;
  offlineImage?: string | null;
}

type StreamInfo = {
  isLive: boolean;
  thumbnail: string | null;
  title: string | null;
  game: string | null;
  viewers: number;
};

export function TwitchPlayer({ channel, offlineImage }: TwitchPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [streamInfo, setStreamInfo] = useState<StreamInfo>({
    isLive: false,
    thumbnail: null,
    title: null,
    game: null,
    viewers: 0
  });

  // Verifica status da live a cada 60s
  useEffect(() => {
    const checkLiveStatus = async () => {
      try {
        const res = await fetch(`/api/twitch/status?channel=${channel}`);
        const data = await res.json();
        setStreamInfo({
            isLive: data.isLive,
            thumbnail: data.thumbnail, // A API já trata o {width}x{height}
            title: data.title,
            game: data.game,
            viewers: data.viewers
        });
      } catch (error) {
        console.error("Erro ao verificar status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkLiveStatus();
    const interval = setInterval(checkLiveStatus, 60000);
    return () => clearInterval(interval);
  }, [channel]);

  if (!channel) return null;

  // URL para redirecionar
  const twitchUrl = `https://twitch.tv/${channel}`;

  // Imagem de fundo: Prioridade para Thumbnail da Live > Banner Offline > Cor sólida
  const bgImage = streamInfo.isLive && streamInfo.thumbnail 
    ? streamInfo.thumbnail 
    : (offlineImage || "");

  return (
    <div className="w-full h-full relative group bg-gray-950 overflow-hidden">
      
      {/* 1. IMAGEM DE FUNDO (Com Blur) */}
      {bgImage && (
        <div className="absolute inset-0 z-0">
            <img 
                src={bgImage} 
                alt="Background" 
                className={`w-full h-full object-cover transition-all duration-700 
                    ${streamInfo.isLive ? "scale-105 blur-sm brightness-50" : "opacity-50 grayscale"} 
                `}
            />
        </div>
      )}

      {/* 2. LOADING STATE */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950 z-20">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        </div>
      )}

      {/* 3. CONTEÚDO (Overlay) */}
      {!loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
            
            {/* Ícone Pulsante se estiver AO VIVO */}
            {streamInfo.isLive ? (
                <div className="mb-6 relative">
                    <span className="absolute -inset-1 rounded-full bg-red-600 opacity-75 animate-ping"></span>
                    <div className="relative bg-red-600 text-white px-4 py-1 rounded-full font-bold text-sm tracking-wider flex items-center gap-2 shadow-xl border border-red-400">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        AO VIVO AGORA
                    </div>
                </div>
            ) : (
                <Twitch className="w-16 h-16 text-gray-400 mb-4 opacity-50" />
            )}

            {/* Título e Jogo */}
            <h3 className="text-2xl md:text-3xl font-black text-white mb-2 drop-shadow-lg max-w-2xl leading-tight">
                {streamInfo.isLive ? (streamInfo.title || "Transmissão ao Vivo") : "Offline no Momento"}
            </h3>
            
            {streamInfo.isLive && streamInfo.game && (
                <p className="text-purple-300 font-medium mb-1 flex items-center gap-2 bg-black/40 px-3 py-1 rounded-lg backdrop-blur-md">
                    <Gamepad2 className="w-4 h-4" /> Jogando {streamInfo.game}
                </p>
            )}

            {streamInfo.isLive && (
                <p className="text-gray-300 text-sm mb-8 flex items-center gap-1">
                    <Users className="w-4 h-4" /> {streamInfo.viewers} pessoas assistindo
                </p>
            )}

            {!streamInfo.isLive && (
                <p className="text-gray-400 mb-8 max-w-md">
                    Confira o cronograma para saber quando será a próxima live!
                </p>
            )}

            {/* BOTÃO DE AÇÃO */}
            <Button 
                size="lg" 
                className={`
                    h-14 px-8 text-lg font-bold shadow-2xl transition-all hover:scale-105
                    ${streamInfo.isLive 
                        ? "bg-purple-600 hover:bg-purple-700 text-white border-2 border-purple-400/20" 
                        : "bg-transparent border-2 border-gray-600 text-gray-300 hover:bg-white/10"
                    }
                `} 
                asChild
            >
                <a href={twitchUrl} target="_blank" rel="noopener noreferrer">
                    {streamInfo.isLive ? (
                        <>
                            <Play className="w-6 h-6 mr-2 fill-current" /> Assistir na Twitch
                        </>
                    ) : (
                        "Visitar Canal"
                    )}
                </a>
            </Button>
        </div>
      )}
    </div>
  );
}