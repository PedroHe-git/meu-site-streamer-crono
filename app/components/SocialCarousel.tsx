"use client"; // Importante: Componente de Cliente

import { useState } from "react";
import { Youtube, Instagram, ChevronLeft, ChevronRight, ExternalLink, Play, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

type SocialItem = {
  id: string;
  platform: "YOUTUBE" | "INSTAGRAM";
  title: string;
  imageUrl: string;
  linkUrl: string;
  subtitle: string;
};

interface SocialCarouselProps {
  ytItems: SocialItem[];
  instaItems: SocialItem[];
}

export default function SocialCarousel({ ytItems, instaItems }: SocialCarouselProps) {
  const [ytIndex, setYtIndex] = useState(0);
  const [instaIndex, setInstaIndex] = useState(0);

  // Navegação
  const nextSlide = (platform: "YT" | "INSTA") => {
    if (platform === "YT") {
      setYtIndex((prev) => (prev === ytItems.length - 1 ? 0 : prev + 1));
    } else {
      setInstaIndex((prev) => (prev === instaItems.length - 1 ? 0 : prev + 1));
    }
  };

  const prevSlide = (platform: "YT" | "INSTA") => {
    if (platform === "YT") {
      setYtIndex((prev) => (prev === 0 ? ytItems.length - 1 : prev - 1));
    } else {
      setInstaIndex((prev) => (prev === 0 ? instaItems.length - 1 : prev - 1));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl mx-auto flex-1 items-center">
          
      {/* =======================
          LADO ESQUERDO: YOUTUBE
          ======================= */}
      <div className="relative group w-full aspect-video lg:aspect-[16/10] bg-gray-900/30 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
        
        {/* Header do Card */}
        <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg text-white shadow-lg shadow-red-900/20">
              <Youtube className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-none">YouTube</h2>
              <p className="text-xs text-red-200/70">Vídeos Longos & Shorts</p>
            </div>
        </div>

        {/* Conteúdo do Slide */}
        {ytItems.length > 0 ? (
            <div className="relative w-full h-full">
              {/* Imagem de Fundo */}
              <img 
                src={ytItems[ytIndex].imageUrl} 
                alt={ytItems[ytIndex].title}
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

              {/* Texto e Play */}
              <div className="absolute bottom-0 left-0 p-8 w-full z-20">
                  <span className="inline-block bg-red-600/90 text-white text-[10px] font-bold px-2 py-1 rounded mb-2 uppercase tracking-wide">
                    Assista Agora
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 line-clamp-2">
                    {ytItems[ytIndex].title}
                  </h3>
                  <div className="flex items-center gap-4">
                    <Button className="bg-white text-black hover:bg-gray-200 rounded-full font-bold px-6" asChild>
                        <a href={ytItems[ytIndex].linkUrl} target="_blank">
                          <Play className="w-4 h-4 mr-2 fill-black" /> Ver Vídeo
                        </a>
                    </Button>
                    <p className="text-sm text-gray-300">{ytItems[ytIndex].subtitle}</p>
                  </div>
              </div>

              {/* Botões de Navegação */}
              {ytItems.length > 1 && (
                <>
                  <button onClick={() => prevSlide("YT")} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-red-600 transition-colors z-30">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button onClick={() => nextSlide("YT")} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-red-600 transition-colors z-30">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
        ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Nenhum vídeo cadastrado.</p>
            </div>
        )}
      </div>

      {/* =======================
          LADO DIREITO: INSTAGRAM
          ======================= */}
      <div className="relative group w-full aspect-[4/5] lg:aspect-[16/10] bg-gray-900/30 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
        
          {/* Header do Card */}
          <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
            <div className="bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 p-2 rounded-lg text-white shadow-lg">
              <Instagram className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-none">Instagram</h2>
              <p className="text-xs text-pink-200/70">Daily & Lifestyle</p>
            </div>
        </div>

        {/* Conteúdo do Slide */}
        {instaItems.length > 0 ? (
            <div className="relative w-full h-full">
              <img 
                src={instaItems[instaIndex].imageUrl} 
                alt={instaItems[instaIndex].title}
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

              <div className="absolute bottom-0 left-0 p-8 w-full z-20">
                  <div className="flex items-center gap-2 mb-3 text-pink-400">
                    <Heart className="w-5 h-5 fill-pink-500" />
                    <span className="text-sm font-medium">{instaItems[instaIndex].subtitle || "Confira no feed"}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-4 line-clamp-2">
                    {instaItems[instaIndex].title}
                  </h3>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white hover:text-black rounded-full px-6" asChild>
                    <a href={instaItems[instaIndex].linkUrl} target="_blank">
                        Ver Postagem <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
              </div>

              {instaItems.length > 1 && (
                <>
                  <button onClick={() => prevSlide("INSTA")} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-pink-600 transition-colors z-30">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button onClick={() => nextSlide("INSTA")} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-pink-600 transition-colors z-30">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
        ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Nenhum post cadastrado.</p>
            </div>
        )}
      </div>

    </div>
  );
}