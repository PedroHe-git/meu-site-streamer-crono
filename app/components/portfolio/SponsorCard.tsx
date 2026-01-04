"use client";

import { ExternalLink } from "lucide-react";
import Image from "next/image";

type Sponsor = {
  id: string;
  name: string;
  category: string | null;
  imageUrl: string;
  linkUrl: string | null;
  description: string | null;
};

export default function SponsorCard({ partner }: { partner: Sponsor }) {
  
  const handleTrackClick = () => {
    // Pegamos o path atual ou "/"
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : "/";

    // Debug: Mostra no console do navegador que o clique foi tentado
    console.log("Enviando clique:", { event: "CLICK", details: partner.name });

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        // 👇 AQUI ESTAVA O PROBLEMA: Usando os nomes exatos da sua API
        event: "CLICK",           // Sua API espera 'event'
        details: partner.name,    // Sua API espera 'details'
        path: currentPath         // Sua API espera 'path'
      }),
      keepalive: true 
    }).catch(err => console.error("Erro no tracking:", err));
  };

  return (
    <a 
      href={partner.linkUrl || "#"}
      target={partner.linkUrl ? "_blank" : "_self"}
      rel="noopener noreferrer"
      onClick={handleTrackClick} 
      className="group relative flex flex-col items-center text-center p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.2)]"
    >
      {/* ... (O restante do layout e imagens continua igual) ... */}
      
      {partner.category && (
        <span className="absolute top-4 right-4 text-[10px] font-mono text-gray-500 bg-black/40 px-2 py-1 rounded border border-white/5 group-hover:text-white group-hover:border-purple-500/30 transition-colors">
            {partner.category}
        </span>
      )}

      <div className="relative mb-6 w-24 h-24 flex items-center justify-center">
        <div className="absolute inset-0 bg-white/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {partner.imageUrl ? (
          <Image 
             src={partner.imageUrl} 
             alt={partner.name} 
             fill 
             unoptimized={true}
             sizes="96px"
             className="object-contain opacity-80 group-hover:opacity-100 transition-all duration-500 relative z-10 scale-95 group-hover:scale-100"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-full text-xl font-bold text-gray-500 relative z-10">
            {partner.name.charAt(0)}
          </div>
        )}
      </div>

      <div className="space-y-2 relative z-10">
        <h4 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors flex items-center justify-center gap-2">
           {partner.name}
           {partner.linkUrl && <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />}
        </h4>
        <p className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors leading-relaxed line-clamp-2">
          {partner.description || "Parceiro oficial."}
        </p>
      </div>

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent group-hover:w-3/4 transition-all duration-700 opacity-50" />
    </a>
  );
}