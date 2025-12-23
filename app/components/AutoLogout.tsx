// app/components/AutoLogout.tsx
"use client";

import { useEffect, useCallback } from "react";
import { Moon, MousePointer2 } from "lucide-react";
import { useHibernation } from "@/app/context/HibernationContext"; // 👈 Importar

export default function AutoLogout() {
  // 👇 Usamos o contexto global agora
  const { isHibernating, setIsHibernating } = useHibernation();

  // 5 Minutos (Ideal para Neon Free Tier)
  const TIMEOUT_MS = 5 * 60 * 1000; 

  const wakeUp = useCallback(() => {
    if (isHibernating) {
      console.log("Voltando da hibernação...");
      setIsHibernating(false);
    }
  }, [isHibernating, setIsHibernating]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const startTimer = () => {
      clearTimeout(timeoutId);
      if (isHibernating) return;

      timeoutId = setTimeout(() => {
        console.log("💤 Inatividade. Hibernando...");
        setIsHibernating(true);
      }, TIMEOUT_MS);
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove", "click"];

    if (!isHibernating) {
      events.forEach((event) => window.addEventListener(event, startTimer));
      startTimer();
    }

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, startTimer));
    };
  }, [isHibernating, setIsHibernating]); // Removido TIMEOUT_MS das deps para evitar re-renders

  if (!isHibernating) return null;

  return (
    <div 
      onClick={wakeUp}
      className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center text-center animate-in fade-in duration-700 cursor-pointer select-none touch-none"
    >
      {/* ... (O resto do HTML/Visual permanece idêntico ao anterior) ... */}
      <div className="group relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative w-32 h-32 bg-gray-900 ring-1 ring-white/10 rounded-full flex items-center justify-center mb-8 shadow-2xl">
           <Moon className="w-16 h-16 text-purple-400 fill-purple-400/20 animate-pulse duration-[3000ms]" />
        </div>
      </div>
      <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Modo de Economia</h1>
      <p className="text-gray-400 max-w-md text-lg mb-12 px-4 leading-relaxed">
        O sistema entrou em pausa para economizar recursos.<br/>
        Clique para voltar.
      </p>
    </div>
  );
}