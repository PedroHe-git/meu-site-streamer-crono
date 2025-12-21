"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"
import { PlayCircle, Youtube, Loader2 } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type SocialItem = {
  id: string;
  title: string | null;
  imageUrl: string;
  subtitle: string | null;
  linkUrl: string;
};

export function VideoCarousel() {
  const [videos, setVideos] = useState<SocialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch("/api/social?platform=YOUTUBE");
        if (response.ok) {
          const data = await response.json();
          setVideos(data);
        }
      } catch (error) {
        console.error("Erro ao carregar vídeos:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVideos();
  }, []);

  if (!isLoading && videos.length === 0) return null;

  return (
    <section id="videos" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        
        <div className="flex flex-col items-center justify-center mb-12 text-center">
            <div className="p-3 bg-red-100 rounded-full text-red-600 mb-4">
                <Youtube className="w-8 h-8" />
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-2">Destaques do Canal</h2>
            <p className="text-gray-500">Vídeos novos toda semana.</p>
        </div>

        <div className="max-w-7xl mx-auto relative px-8">
          {isLoading ? (
             <div className="flex justify-center p-12"><Loader2 className="animate-spin text-red-500" /></div>
          ) : (
            <Carousel
              opts={{ align: "start", loop: videos.length > 3 }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {videos.map((video) => (
                  <CarouselItem key={video.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col group">
                      <a
                        href={video.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block relative aspect-video overflow-hidden bg-gray-900"
                      >
                        <img
                          src={video.imageUrl}
                          alt={video.title || "Vídeo"}
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-black/20 backdrop-blur-[2px]">
                           <div className="bg-red-600 text-white rounded-full p-3 shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                              <PlayCircle className="w-8 h-8 fill-current" />
                           </div>
                        </div>
                        {video.subtitle && (
                          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded">
                              {video.subtitle}
                          </div>
                        )}
                      </a>
                      
                      <div className="p-5 flex flex-col flex-grow">
                        <h3 className="font-bold text-gray-800 line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">
                          <a href={video.linkUrl} target="_blank">{video.title || "Sem título"}</a>
                        </h3>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              <CarouselPrevious className="border-gray-200 hover:bg-red-50 hover:text-red-600" />
              <CarouselNext className="border-gray-200 hover:bg-red-50 hover:text-red-600" />
            </Carousel>
          )}

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" className="border-red-200 text-red-600 hover:bg-red-50" asChild>
                <a href="https://www.youtube.com/@mahcetou" target="_blank">
                    Inscrever-se no Canal
                </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}