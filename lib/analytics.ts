// lib/analytics.ts

export const trackClick = (linkName: string) => {
  if (typeof window === "undefined") return; // Só roda no navegador

  // Manda o evento sem travar a navegação (fire and forget)
  fetch("/api/analytics/track", {
    method: "POST",
    body: JSON.stringify({ 
        event: "CLICK", 
        details: linkName 
    }),
    keepalive: true, // Garante que envie mesmo se a pessoa sair do site
  }).catch((err) => console.error("Erro tracking:", err));
};