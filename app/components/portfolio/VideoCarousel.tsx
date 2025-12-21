"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Definição do Tipo
type Video = {
  id: string; // <-- Verifique se está como 'string' (antes era 'number')
  title: string;
  thumbnail: string;
  views: string;
  duration: string;
};

// Dados de exemplo para carregar
const loadingVideos: Video[] = Array(3).fill({
  id: "loader", // <-- Mude para string "loader"
  title: "Carregando...",
  thumbnail: "",
  views: "...",
  duration: "...",
});

export function VideoCarousel() {
  // Crie o estado para os vídeos
  const [videos, setVideos] = useState<Video[]>(loadingVideos);
  const [isLoading, setIsLoading] = useState(true);

  // Use useEffect para buscar os dados da NOSSA API
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch("/api/youtube");
        if (!response.ok) {
          throw new Error("Falha ao buscar vídeos do servidor");
        }
        const data: Video[] = await response.json();
        setVideos(data);
      } catch (error) {
        console.error("Erro ao buscar vídeos:", error);
        setVideos([]); 
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, []); 

  // O RESTANTE DO ARQUIVO CONTINUA EXATAMENTE IGUAL...
  // (Renderização do Carousel, JSX, etc.)
  // ...
  return (
    <section id="videos" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-center mb-8">Últimos vídeos</h2>
        <div className="max-w-6xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: videos.length > 3,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {(isLoading ? loadingVideos : videos).map((video, index) => (
                <CarouselItem
                  key={isLoading ? `loader-${index}` : video.id}
                  className="pl-4 md:basis-1/2 lg:basis-1/3"
                >
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group h-full">
                    {isLoading ? (
                      // Skeleton (placeholder de carregamento)
                      <div className="animate-pulse">
                        <div className="aspect-video bg-gray-200"></div>
                        <div className="p-4">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    ) : (
                      // Conteúdo real do card
                      <a
                        href={`https://www.youtube.com/watch?v=${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-full flex flex-col"
                      >
                        <div className="relative aspect-video overflow-hidden">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="h-16 w-16 rounded-full bg-red-600 flex items-center justify-center">
                              <svg
                                className="h-8 w-8 text-white ml-1"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                            {video.duration} {/* <-- Agora vai exibir o tempo real */}
                          </div>
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                          <h3 className="mb-2 line-clamp-2 flex-grow">{video.title}</h3>
                          <p className="text-sm text-gray-600 mt-auto">
                            {video.views} visualizações {/* <-- Agora vai exibir as views reais */}
                          </p>
                        </div>
                      </a>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 hidden md:flex rounded-full bg-white shadow-lg" />
            <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 hidden md:flex rounded-full bg-white shadow-lg" />
          </Carousel>

          <div className="text-center mt-8">
            <a href="https://www.youtube.com/@mahcetou"
            target="_blank"
            rel="noopener noreferrer"
            >
            <Button variant="outline" size="lg" className="gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              Ver Todos os Vídeos
            </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}