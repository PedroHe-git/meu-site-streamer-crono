"use client";

import Image from "next/image";
import { Youtube, Instagram, Play, ExternalLink, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
  return (
    <div className="w-full space-y-16 pb-20">
      
      {/* =======================
          SEÇÃO YOUTUBE
          ======================= */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-red-600 p-2 rounded-lg text-white shadow-lg shadow-red-900/20">
            <Youtube className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-2xl text-white">YouTube</h2>
            <p className="text-sm text-gray-400">Vídeos recentes e destaques</p>
          </div>
        </div>

        {ytItems.length > 0 ? (
          <Carousel
            opts={{ align: "start", loop: true }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {ytItems.map((item) => (
                // Basis-1/1 (Mobile), 1/2 (Tablet), 1/3 (Desktop)
                <CarouselItem key={item.id} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                  <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="group block h-full">
                    <Card className="bg-gray-900/50 border-gray-800 overflow-hidden hover:border-red-500/50 transition-all duration-300 h-full group-hover:-translate-y-1">
                      <div className="relative aspect-video">
                        <img
                          src={item.imageUrl}
                          alt={item.title}                         
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                            <Play className="w-5 h-5 text-white ml-1" />
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-4 space-y-2">
                        <h3 className="font-bold text-white line-clamp-2 group-hover:text-red-400 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                          {item.subtitle || "Assista Agora"}
                        </p>
                      </CardContent>
                    </Card>
                  </a>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
                <CarouselPrevious className="bg-gray-900 border-gray-700 text-white hover:bg-red-600 hover:border-red-600" />
                <CarouselNext className="bg-gray-900 border-gray-700 text-white hover:bg-red-600 hover:border-red-600" />
            </div>
          </Carousel>
        ) : (
          <div className="p-8 border border-dashed border-gray-800 rounded-xl text-center text-gray-500">
            Nenhum vídeo encontrado.
          </div>
        )}
      </div>

      {/* =======================
          SEÇÃO INSTAGRAM
          ======================= */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 p-2 rounded-lg text-white shadow-lg">
            <Instagram className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-2xl text-white">Instagram</h2>
            <p className="text-sm text-gray-400">Fotos, Reels e Stories</p>
          </div>
        </div>

        {instaItems.length > 0 ? (
          <Carousel
            opts={{ align: "start", loop: true }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {instaItems.map((item) => (
                // Basis-1/2 (Mobile), 1/3 (Tablet), 1/4 (Desktop) - Menor pois são fotos verticais/quadradas
                <CarouselItem key={item.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                  <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="group block h-full">
                    <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-pink-500/50 transition-all duration-300 shadow-lg">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                      
                      <div className="absolute bottom-0 left-0 p-4 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <div className="flex items-center gap-2 text-pink-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">
                           <Heart className="w-3 h-3 fill-current" /> 
                           <span>Ver Post</span>
                        </div>
                        <p className="text-sm text-white font-medium line-clamp-2 leading-snug">
                            {item.title}
                        </p>
                      </div>
                    </div>
                  </a>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
                <CarouselPrevious className="bg-gray-900 border-gray-700 text-white hover:bg-pink-600 hover:border-pink-600" />
                <CarouselNext className="bg-gray-900 border-gray-700 text-white hover:bg-pink-600 hover:border-pink-600" />
            </div>
          </Carousel>
        ) : (
          <div className="p-8 border border-dashed border-gray-800 rounded-xl text-center text-gray-500">
            Nenhum post encontrado.
          </div>
        )}
      </div>

    </div>
  );
}