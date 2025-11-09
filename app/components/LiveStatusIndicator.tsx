"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Props {
  username: string;
  className?: string;
}

export default function LiveStatusIndicator({ username, className }: Props) {
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Função para buscar o status
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/users/${username}/livestatus`);
        if (res.ok) {
          const data = await res.json();
          setIsLive(data.isLive);
        }
      } catch (error) {
        console.error("Falha ao buscar status da live:", error);
        setIsLive(false); // Assume offline em caso de erro
      } finally {
        setIsLoading(false);
      }
    };

    // Busca imediatamente
    fetchStatus();

    // Define um intervalo para verificar novamente a cada 2 minutos
    const interval = setInterval(fetchStatus, 120000); // 120000 ms = 2 minutos

    // Limpa o intervalo quando o componente é desmontado
    return () => clearInterval(interval);

  }, [username]); // Executa novamente se o 'username' mudar

  // Não renderiza nada se estiver carregando ou se o utilizador não estiver ao vivo
  if (isLoading || !isLive) {
    return null;
  }

  // Renderiza o indicador "LIVE"
  return (
    <div 
      className={cn(
        "flex items-center gap-1.5 bg-red-600 text-white px-2 py-0.5 rounded-md",
        className 
      )}
      title="Este criador está ao vivo na Twitch!"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-200"></span>
      </span>
      <span className="text-xs font-bold uppercase">LIVE</span>
    </div>
  );
}