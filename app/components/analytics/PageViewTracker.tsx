"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Evita contar acessos locais (localhost) para não sujar os dados
   // if (process.env.NODE_ENV === "development") return;

    // Envia o sinal para somar +1
    fetch("/api/analytics/track", {
      method: "POST",
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    });
  }, [pathname]);

  return null; // Este componente não renderiza nada visualmente
}