"use client";

import { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, Clock, MonitorPlay, Tv, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Definimos a interface aceitando string OU Date para evitar erros
interface ScheduleItem {
  id: string;
  title?: string | null;
  scheduledAt: string | Date; // <--- AQUI ESTA A CORREÇÃO
  media?: {
    title: string;
    posterPath?: string | null;
    mediaType?: string;
  } | null;
  user?: {
    name?: string | null;
    image?: string | null;
  } | null;
}

interface ScheduleSliderProps {
  items: ScheduleItem[];
}

export default function ScheduleSlider({ items }: ScheduleSliderProps) {
  // Ordena itens garantindo que a data seja um objeto Date válido
  const sortedItems = [...items].sort((a, b) => 
    new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % sortedItems.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + sortedItems.length) % sortedItems.length);
  };

  if (items.length === 0) return null;

  const currentItem = sortedItems[currentIndex];
  // CONVERSÃO SEGURA: Garante que é um objeto Date
  const itemDate = new Date(currentItem.scheduledAt);

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Container Principal */}
      <div className="relative bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl min-h-[500px] flex flex-col md:flex-row">
        
        {/* Lado Esquerdo: Imagem/Poster */}
        <div className="relative w-full md:w-5/12 h-64 md:h-auto overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 md:hidden" />
          
          {currentItem.media?.posterPath ? (
            <Image
              src={currentItem.media.posterPath}
              alt={currentItem.media.title || "Capa"}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              priority
            />
          ) : (
             // Fallback se não tiver imagem
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <MonitorPlay className="w-20 h-20 text-gray-700" />
            </div>
          )}
          
          {/* Badge de Tipo de Mídia */}
          <div className="absolute top-4 left-4 z-20">
             <Badge variant="secondary" className="bg-black/60 backdrop-blur-md border-white/10 text-white px-3 py-1">
                {currentItem.media?.mediaType === "ANIME" ? "Anime" : 
                 currentItem.media?.mediaType === "MOVIE" ? "Filme" : "Live"}
             </Badge>
          </div>
        </div>

        {/* Lado Direito: Informações */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center relative">
          
          {/* Data e Hora em Destaque */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex flex-col items-center bg-purple-600/10 border border-purple-500/20 rounded-2xl p-3 min-w-[70px]">
              <span className="text-sm text-purple-400 font-bold uppercase">
                {format(itemDate, "MMM", { locale: ptBR })}
              </span>
              <span className="text-3xl font-black text-white">
                {format(itemDate, "dd")}
              </span>
            </div>
            
            <div className="flex flex-col">
              <h2 className="text-gray-400 text-sm font-medium flex items-center gap-2 uppercase tracking-widest">
                <Clock className="w-4 h-4 text-purple-500" />
                Horário da Live
              </h2>
              <p className="text-2xl font-bold text-white">
                {format(itemDate, "HH:mm")}h
              </p>
            </div>
          </div>

          {/* Título Principal */}
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4 line-clamp-2">
            {currentItem.title || currentItem.media?.title || "Sem título definido"}
          </h1>

          {/* Descrição ou infos extras (opcional) */}
          <p className="text-gray-400 text-lg mb-8 line-clamp-3">
             {currentItem.media?.title 
               ? `Vamos assistir e reagir a ${currentItem.media.title}. Prepare a pipoca!` 
               : "Uma transmissão especial preparada para você."}
          </p>

          {/* Rodapé do Card: Streamer */}
          <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-white/10">
                 {currentItem.user?.image ? (
                   <Image src={currentItem.user.image} width={40} height={40} alt="Avatar" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">M</div>
                 )}
              </div>
              <div className="flex flex-col">
                 <span className="text-sm font-bold text-white">{currentItem.user?.name || "Streamer"}</span>
                 <span className="text-xs text-gray-500">Host</span>
              </div>
            </div>

            <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-6 font-bold transition-all hover:scale-105">
               Definir Lembrete
            </Button>
          </div>

        </div>

        {/* Botões de Navegação (Setas) */}
        {sortedItems.length > 1 && (
          <div className="absolute bottom-6 right-6 flex gap-2 z-30">
            <button 
              onClick={prevSlide}
              className="w-12 h-12 rounded-full bg-black/50 hover:bg-purple-600 border border-white/10 flex items-center justify-center text-white transition-all backdrop-blur-md"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={nextSlide}
              className="w-12 h-12 rounded-full bg-black/50 hover:bg-purple-600 border border-white/10 flex items-center justify-center text-white transition-all backdrop-blur-md"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
      
      {/* Indicadores (Dots) */}
      {sortedItems.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {sortedItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                idx === currentIndex ? "w-8 bg-purple-500" : "bg-gray-700 hover:bg-gray-600"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}