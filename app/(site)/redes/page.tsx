import { prisma } from "@/lib/prisma";
import { getSocialItems } from "@/lib/data"; // Supondo que isso busca no banco
import SocialCarousel from "@/app/components/SocialCarousel";
import { unstable_cache } from "next/cache"; // 👈 Importar cache

export const revalidate = 60; 

// Função cacheada que busca TUDO de uma vez e segura por 1 hora
const getCachedSocialPageData = unstable_cache(
  async () => {
    // Busca tudo em paralelo para ser mais rápido
    const [rawYtItems, rawInstaItems, creator] = await Promise.all([
      getSocialItems("YOUTUBE"),
      getSocialItems("INSTAGRAM"),
      prisma.user.findFirst({ where: { role: "CREATOR" } })
    ]);

    return { rawYtItems, rawInstaItems, creator };
  },
  ['social-page-full-data'], // Chave única
  {
    revalidate: 3600, // 👈 Cache de 1 hora. O banco dorme o resto do tempo.
    tags: ['social', 'user-profile'] // Tags para invalidar se postar algo novo
  }
);

export default async function SocialPage() {
  // Usa a versão cacheada
  const { rawYtItems, rawInstaItems, creator } = await getCachedSocialPageData();

  // 3. Formata os dados (processamento leve, pode ficar fora do cache)
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

  const youtubeChannels = [
    { label: "Mah", url: creator?.youtubeMainUrl, type: "MAIN" },
    { label: "Cinemah", url: creator?.youtubeSecondUrl, type: "LIVES" },
    { label: "Mahnimes", url: creator?.youtubeThirdUrl, type: "CLIPS" },
    { label: "Mah Cortes", url: creator?.youtubeFourthUrl, type: "EXTRAS" },
  ].filter(c => c.url) as any[];

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