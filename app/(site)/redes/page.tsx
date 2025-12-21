import { getSocialItems } from "@/lib/data"; // Função de Cache
import SocialCarousel from "@/app/components/SocialCarousel"; // Importa o componente visual

// Componente de Servidor (Async)
export default async function SocialPage() {
  
  // 1. Busca os dados no servidor (Rápido e Cacheado)
  const rawYtItems = await getSocialItems("YOUTUBE");
  const rawInstaItems = await getSocialItems("INSTAGRAM");

  // 2. Função auxiliar para corrigir os tipos (String -> "YOUTUBE" | "INSTAGRAM" e null -> "")
  const formatItems = (items: any[]) => items.map((item) => ({
    id: item.id,
    platform: item.platform as "YOUTUBE" | "INSTAGRAM", // Força o tipo correto
    title: item.title || "Sem título", // Garante que não seja null
    imageUrl: item.imageUrl,
    linkUrl: item.linkUrl,
    subtitle: item.subtitle || "", // Garante que não seja null
  }));

  const ytItems = formatItems(rawYtItems);
  const instaItems = formatItems(rawInstaItems);

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-24 pb-10 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Luzes de Fundo */}
      <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-pink-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 max-w-7xl h-full flex flex-col">
        
        {/* Cabeçalho */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">
            Acompanhe o <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600">Conteúdo</span>
          </h1>
          <p className="text-gray-400">Últimos lançamentos e bastidores.</p>
        </div>

        {/* 3. Passa os dados formatados para o componente interativo */}
        <SocialCarousel ytItems={ytItems} instaItems={instaItems} />
        
      </div>
    </main>
  );
}