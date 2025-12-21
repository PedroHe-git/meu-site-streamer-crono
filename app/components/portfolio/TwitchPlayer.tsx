"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { PlayCircle } from "lucide-react";

interface TwitchPlayerProps {
  channel?: string;
  offlineImage?: string | null; // Nova prop para a imagem
}

export function TwitchPlayer({ channel, offlineImage }: TwitchPlayerProps) {
  const embedRef = useRef<HTMLDivElement>(null);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  
  const targetChannel = channel || process.env.NEXT_PUBLIC_TWITCH_CHANNEL || "monstercat";

  // 1. Verifica se está ao vivo para decidir o que mostrar
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/twitch/status?channel=${targetChannel}`);
        const data = await res.json();
        setIsLive(data.isLive);
      } catch (error) {
        console.error("Erro ao verificar live:", error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [targetChannel]);

  // 2. Carrega o Player da Twitch (Só se estiver LIVE ou se não tiver imagem de capa)
  useEffect(() => {
    if (loading) return; // Espera verificar o status
    
    // Se estiver OFFLINE e tiver imagem, NÃO carrega o player (mostra a imagem)
    if (!isLive && offlineImage) return;

    if (!embedRef.current) return;

    embedRef.current.innerHTML = ""; // Limpa anterior

    const script = document.createElement("script");
    script.src = "https://embed.twitch.tv/embed/v1.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      // @ts-ignore
      if (window.Twitch && window.Twitch.Embed) {
        // @ts-ignore
        new window.Twitch.Embed(embedRef.current, {
          width: "100%",
          height: "100%",
          channel: targetChannel,
          layout: "video",
          autoplay: true,
          muted: true,
          parent: ["localhost", "meucronograma.live", "vercel.app"],
        });
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [targetChannel, isLive, loading, offlineImage]);

  return (
    <div className="w-full h-full min-h-[400px] bg-black relative group">
      
      {/* CENÁRIO A: Está OFFLINE e temos uma imagem de capa configurada.
         Mostramos a imagem com um botão ou texto.
      */}
      {!loading && !isLive && offlineImage ? (
        <div className="absolute inset-0 z-10">
           <Image 
             src={offlineImage} 
             alt="Canal Offline" 
             fill 
             className="object-cover opacity-60 group-hover:opacity-40 transition-opacity"
           />
           <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <div className="bg-black/50 p-4 rounded-full backdrop-blur-sm mb-4">
                 <PlayCircle className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold">O Streamer está Offline</h3>
              <p className="text-gray-300 mt-2">Confira o Cronograma para a próxima live!</p>
              
              {/* Botão opcional para forçar o player (ex: ver chat/vods) */}
              <button 
                onClick={() => setIsLive(true)} // Truque: Força o estado para "Live" para carregar o player
                className="mt-6 text-sm underline text-purple-400 hover:text-purple-300 cursor-pointer"
              >
                Acessar Chat ou Reprises
              </button>
           </div>
        </div>
      ) : (
        /* CENÁRIO B: Está AO VIVO (ou sem capa) -> Mostra o Player Normal */
        <div ref={embedRef} className="w-full h-full absolute inset-0" />
      )}

    </div>
  );
}