"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Evita contar acessos no próprio dashboard ou local
    if (pathname.startsWith("/dashboard")) return;

    // Envia o evento de Page View
    const trackPage = async () => {
      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "PAGE_VIEW",
            label: pathname // Ex: "/cronograma"
          }),
        });
      } catch (e) {
        // Silêncio é ouro em analytics
      }
    };

    // Pequeno delay para garantir que não é um bounce imediato
    const timeout = setTimeout(trackPage, 2000);
    return () => clearTimeout(timeout);
  }, [pathname]);

  return null; // Componente invisível
}