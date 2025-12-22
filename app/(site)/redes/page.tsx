import { prisma } from "@/lib/prisma";
import { getSocialItems } from "@/lib/data";
import { Instagram, ExternalLink, Heart, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export const revalidate = 60; // Atualiza a cada 60s

export default async function InstagramPage() {
  // 1. Busca apenas itens do INSTAGRAM
  const rawInstaItems = await getSocialItems("INSTAGRAM");

  // 2. Formata os dados
  const posts = rawInstaItems.map((item: any) => ({
    id: item.id,
    title: item.title || "Sem legenda",
    imageUrl: item.imageUrl,
    linkUrl: item.linkUrl,
    subtitle: item.subtitle || "Ver no Instagram",
  }));

  // Link do perfil (Você pode adicionar no banco depois se quiser, por enquanto fixo ou vindo de um item)
  const PROFILE_LINK = "https://instagram.com/mahmoojen"; 

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-24 pb-20 relative overflow-hidden">
      
      {/* Background Decorativo (Gradiente Roxo/Rosa do Insta) */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-purple-600/10 via-pink-600/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-yellow-600/5 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 max-w-7xl">
        
        {/* --- CABEÇALHO --- */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
          <div className="text-center md:text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-pink-500/20 text-pink-400 text-sm font-medium">
               <Instagram className="w-4 h-4" /> @MahMoojen
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight">
              Galeria do <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500">Insta</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl">
              Bastidores, lifestyle e atualizações em tempo real. Siga para acompanhar o dia a dia.
            </p>
          </div>

          <Button 
            asChild 
            size="lg" 
            className="h-14 px-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-pink-900/20 transition-all hover:scale-105"
          >
            <a href={PROFILE_LINK} target="_blank" rel="noopener noreferrer">
              Seguir Perfil <ExternalLink className="ml-2 w-5 h-5" />
            </a>
          </Button>
        </div>

        {/* --- CARROSSEL DE POSTS --- */}
        {posts.length > 0 ? (
          <div className="relative">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {posts.map((post) => (
                  // Cards Verticais (Aspecto de celular/insta)
                  <CarouselItem key={post.id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                    <a 
                      href={post.linkUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="group block h-full"
                    >
                      <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-pink-500/50 transition-all duration-500 shadow-xl group-hover:-translate-y-2">
                        
                        {/* Imagem (Usando <img> padrão para evitar erros) */}
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        
                        {/* Overlay Gradiente */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

                        {/* Conteúdo Hover */}
                        <div className="absolute bottom-0 left-0 p-5 w-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <div className="flex items-center gap-2 text-pink-400 mb-2 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                             <Heart className="w-4 h-4 fill-current" />
                             <span className="text-xs font-bold uppercase tracking-wider">Ver Post</span>
                          </div>
                          
                          <h3 className="text-white font-bold leading-snug line-clamp-2 mb-1">
                            {post.title}
                          </h3>
                          <p className="text-xs text-gray-400 line-clamp-1">
                            {post.subtitle}
                          </p>
                        </div>

                        {/* Ícone de Tipo (Canto superior) */}
                        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                           <ExternalLink className="w-4 h-4" />
                        </div>

                      </div>
                    </a>
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              {/* Controles de Navegação */}
              <div className="hidden md:block">
                <CarouselPrevious className="-left-12 bg-gray-900/50 border-gray-700 text-white hover:bg-pink-600 hover:border-pink-600 h-12 w-12" />
                <CarouselNext className="-right-12 bg-gray-900/50 border-gray-700 text-white hover:bg-pink-600 hover:border-pink-600 h-12 w-12" />
              </div>
            </Carousel>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-900/30 border border-dashed border-gray-800 rounded-3xl text-center">
            <div className="p-4 bg-gray-800 rounded-full mb-4">
               <Camera className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400 text-lg">Nenhum post encontrado.</p>
            <p className="text-sm text-gray-600 mt-2">Adicione fotos através do painel administrativo.</p>
          </div>
        )}

      </div>
    </main>
  );
}