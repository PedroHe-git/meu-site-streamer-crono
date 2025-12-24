"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Tv } from "lucide-react";
// 👇 1. Importamos o contexto para saber se o site está dormindo
import { useHibernation } from "@/app/context/HibernationContext";

interface Props {
  twitchChannel: string;
  className?: string;
}

export default function LiveStatusIndicator({ twitchChannel, className }: Props) {
  // 👇 2. Pegamos o estado de hibernação
  const { isHibernating } = useHibernation();
  
  const [isLive, setIsLive] = useState(false);
  const [liveTitle, setLiveTitle] = useState<string | null>(null);
  const [gameName, setGameName] = useState<string | null>(null);
  
  const cleanChannel = twitchChannel.includes('/') 
    ? twitchChannel.split('/').pop() || twitchChannel 
    : twitchChannel;

  const channelUrl = `https://twitch.tv/${cleanChannel}`;

  useEffect(() => {
    // 🛑 3. BLOQUEIO DE SEGURANÇA
    // Se o site estiver hibernando, cancelamos tudo.
    // O 'return' aqui impede que o fetch seja criado ou que o intervalo inicie.
    if (isHibernating) return; 

    const fetchStatus = async () => {
      if (!cleanChannel) return;

      try {
        const res = await fetch(`/api/twitch/status?channel=${cleanChannel}`);
        if (res.ok) {
          const data = await res.json();
          setIsLive(data.isLive);
          if (data.isLive) {
              setLiveTitle(data.liveTitle);
              setGameName(data.gameName);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar live:", error);
        setIsLive(false);
      }
    };

    // Executa a primeira vez
    fetchStatus();

    // Configura o intervalo de 15 minutos
    const interval = setInterval(fetchStatus, 1000 * 60 * 15);
    
    // Limpa o intervalo quando o componente desmonta OU quando entra em hibernação
    return () => clearInterval(interval);
    
  }, [cleanChannel, isHibernating]); // 👈 4. Adicionamos isHibernating nas dependências

  // ... (O resto do return/HTML continua igual)
  const tooltipText = isLive 
    ? `AO VIVO: ${liveTitle || "Sem título"}${gameName ? ` - Jogando ${gameName}` : ""}`
    : `Canal: ${cleanChannel}`;

  return (
    <a 
      href={channelUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold transition-all duration-300 shadow-sm no-underline z-20 group relative",
        isLive 
          ? "bg-red-600 text-white hover:bg-red-700 hover:shadow-red-500/50 animate-pulse" 
          : "bg-[#9146FF] text-white hover:bg-[#772ce8] hover:shadow-[#9146FF]/50",
        className 
      )}
      title={tooltipText}
    >
      {isLive ? (
        <>
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span>LIVE</span>
            
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-black/90 text-white text-[10px] p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none truncate hidden md:block">
                <p className="font-bold truncate">{liveTitle}</p>
                {gameName && <p className="text-gray-300 truncate">{gameName}</p>}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
            </div>
        </>
      ) : (
        <>
            <Tv className="h-3 w-3" />
            <span>Twitch</span>
        </>
      )}
    </a>
  );
}