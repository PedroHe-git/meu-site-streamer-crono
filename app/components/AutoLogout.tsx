"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

export default function AutoLogout() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) return;

    // 👇 TEMPO: 15 minutos (15 * 60 * 1000 ms)
    const TIMEOUT_MS = 15 * 60 * 1000; 
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log("Tempo esgotado. Saindo por inatividade...");
        signOut({ callbackUrl: "/auth/signin" });
      }, TIMEOUT_MS);
    };

    // Eventos que resetam o timer (mostram que você está mexendo)
    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
    
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer(); // Inicia a contagem

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [session]);

  return null;
}