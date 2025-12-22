import { prisma } from "@/lib/prisma";
import { getSocialItems } from "@/lib/data";
import SocialCarousel from "@/app/components/SocialCarousel";

export const revalidate = 60; 

export default async function SocialPage() {
  // 1. Busca os itens de mídia
  const rawYtItems = await getSocialItems("YOUTUBE");
  const rawInstaItems = await getSocialItems("INSTAGRAM");

  // 2. Busca o Criador para pegar os links dos canais
  const creator = await prisma.user.findFirst({ where: { role: "CREATOR" } });

  // 3. Formata os dados
  const ytItems = rawYtItems.map((item: any) => ({
    id: item.id,
    title: item.title || "Sem título",
    imageUrl: item.imageUrl,
    linkUrl: item.linkUrl,
    subtitle: item.subtitle || "Assista agora",
  }));

  const instaItems = rawInstaItems.map((item: any) => ({
    id: item.id,
    title: item.title || "Sem legenda",
    imageUrl: item.imageUrl,
    linkUrl: item.linkUrl,
    subtitle: item.subtitle || "Ver no Instagram",
  }));

  // 4. Prepara a lista de canais (Tipada para o componente)
  const youtubeChannels = [
    { label: "Mah", url: creator?.youtubeMainUrl, type: "MAIN" },
    { label: "Cinemah", url: creator?.youtubeThirdUrl, type: "LIVES" },
    { label: "Mahnimes", url: creator?.youtubeSecondUrl, type: "CLIPS" },
    { label: "Mah Cortes", url: creator?.youtubeFourthUrl, type: "EXTRAS" },
  ].filter(c => c.url) as any[]; // Remove os nulos

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-24 pb-10 flex flex-col relative overflow-hidden">
      
      {/* Background Effects */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-red-900/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-900/10 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 w-full flex flex-col flex-1">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">
            Central de <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-purple-500 to-pink-500">Conteúdo</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Acompanhe tudo o que acontece no YouTube e no Instagram em um só lugar.
          </p>
        </div>

        {/* Componente Dividido */}
        <SocialCarousel 
          ytItems={ytItems} 
          instaItems={instaItems} 
          youtubeChannels={youtubeChannels}
          instaProfileUrl="https://instagram.com/mahmoojen"
        />
      </div>
    </main>
  );
}