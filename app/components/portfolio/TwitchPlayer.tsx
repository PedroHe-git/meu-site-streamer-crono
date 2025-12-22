"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TwitchPlayerProps {
  username: string;
  className?: string;
  isLive?: boolean; // Vamos usar isso para efeitos visuais
}

export default function TwitchPlayer({ username, className, isLive }: TwitchPlayerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Evita erro de hidratação (Next.js)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Simula tempo de carregamento do iframe
  useEffect(() => {
    if (isMounted) {
      const timer = setTimeout(() => setLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isMounted]);

  if (!isMounted) return <Skeleton className="w-full h-full rounded-xl bg-gray-900" />;

  const parentDomain = typeof window !== "undefined" ? window.location.hostname : "";

  return (
    <div className={cn("relative w-full h-full group", className)}>
      {/* Efeito de Glow quando estiver AO VIVO */}
      {isLive && (
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-slow"></div>
      )}

      <div className="relative w-full h-full rounded-xl overflow-hidden bg-black shadow-2xl border border-white/10">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950 z-10">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        <iframe
          src={`https://player.twitch.tv/?channel=${username}&parent=${parentDomain}&autoplay=true&muted=false`}
          height="100%"
          width="100%"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    </div>
  );
}