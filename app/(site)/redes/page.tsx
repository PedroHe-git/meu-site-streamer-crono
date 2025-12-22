import { getSocialItems } from "@/lib/data";
import SocialCarousel from "@/app/components/SocialCarousel";

export const revalidate = 3600; // Atualiza o cache a cada 1 hora

export default async function SocialPage() {
  // 1. Busca os dados no servidor
  const rawYtItems = await getSocialItems("YOUTUBE");
  const rawInstaItems = await getSocialItems("INSTAGRAM");

  // 2. Formata os dados para garantir que não haja nulos
  const formatItems = (items: any[]) => items.map((item) => ({
    id: item.id,
    platform: item.platform as "YOUTUBE" | "INSTAGRAM",
    title: item.title || "Sem título",
    imageUrl: item.imageUrl,
    linkUrl: item.linkUrl,
    subtitle: item.subtitle || "",
  }));

  const ytItems = formatItems(rawYtItems);
  const instaItems = formatItems(rawInstaItems);

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-24 pb-10 flex flex-col items-center justify-center relative overflow-hidden">
      
      <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-pink-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 w-full flex flex-col">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            Feed de <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600">Conteúdo</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Não perca nada! Os últimos vídeos do YouTube e atualizações do Instagram em um só lugar.
          </p>
        </div>

        <SocialCarousel ytItems={ytItems} instaItems={instaItems} />
      </div>
    </main>
  );
}