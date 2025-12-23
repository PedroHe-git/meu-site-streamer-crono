// app/components/AutoLogout.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Moon, MousePointer2 } from "lucide-react";

export default function AutoLogout() {
  const [isHibernating, setIsHibernating] = useState(false);

  // ⏱️ CONFIGURAÇÃO: 5 minutos de inatividade
  // (5 minutos * 60 segundos * 1000 milissegundos)
  const TIMEOUT_MS = 5 * 60 * 1000; 

  // Função para "acordar" o site
  const wakeUp = useCallback(() => {
    if (isHibernating) {
      console.log("Voltando da hibernação...");
      setIsHibernating(false);
    }
  }, [isHibernating]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const startTimer = () => {
      // Limpa timer anterior para reiniciar a contagem
      clearTimeout(timeoutId);

      // Se já estiver dormindo, não faz nada (espera o clique para acordar)
      if (isHibernating) return;

      // Inicia contagem para hibernar
      timeoutId = setTimeout(() => {
        console.log("💤 Inatividade detectada. Entrando em modo de economia...");
        setIsHibernating(true);
      }, TIMEOUT_MS);
    };

    // Lista de eventos que consideram o usuário "ativo"
    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove", "click"];

    // Se NÃO estiver hibernando, monitora os eventos para resetar o timer
    if (!isHibernating) {
      events.forEach((event) => window.addEventListener(event, startTimer));
      startTimer(); // Inicia o primeiro ciclo
    }

    // Limpeza ao desmontar
    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, startTimer));
    };
  }, [isHibernating, TIMEOUT_MS]);

  // Se não estiver hibernando, não renderiza nada (fica invisível)
  if (!isHibernating) return null;

  // Renderiza a TELA DE BLOQUEIO (Impede cliques e requisições ao banco)
  return (
    <div 
      onClick={wakeUp}
      className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center text-center animate-in fade-in duration-700 cursor-pointer select-none touch-none"
    >
      <div className="group relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative w-32 h-32 bg-gray-900 ring-1 ring-white/10 rounded-full flex items-center justify-center mb-8 shadow-2xl">
           <Moon className="w-16 h-16 text-purple-400 fill-purple-400/20 animate-pulse duration-[3000ms]" />
        </div>
      </div>

      <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
        Modo de Economia
      </h1>
      
      <p className="text-gray-400 max-w-md text-lg mb-12 px-4 leading-relaxed">
        O sistema entrou em pausa para economizar recursos do servidor.<br/>
        Sua conexão com o banco de dados foi suspensa.
      </p>

      <div className="flex items-center gap-3 text-sm font-medium text-white/50 bg-white/5 px-6 py-3 rounded-full border border-white/10 hover:bg-white/10 transition-colors">
        <MousePointer2 className="w-4 h-4 animate-bounce" />
        Clique em qualquer lugar para voltar
      </div>
    </div>
  );
}