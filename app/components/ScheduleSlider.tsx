"use client";

import { useState } from "react";
import Image from "next/image";
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, RotateCcw, MonitorPlay, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ScheduleItem {
  id: string;
  title?: string | null;
  scheduledAt: string | Date;
  isCompleted?: boolean;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  media?: {
    title: string;
    posterPath?: string | null;
    mediaType?: string;
  } | null;
}

interface ScheduleSliderProps {
  items: ScheduleItem[];
}

export default function ScheduleSlider({ items }: ScheduleSliderProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const startOfCurrentWeek = startOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });
  const endOfCurrentWeek = endOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));

  const nextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));
  const prevWeek = () => setCurrentDate(prev => subWeeks(prev, 1));
  const resetToToday = () => setCurrentDate(new Date());

  return (
    <div className="w-full max-w-[1800px] mx-auto space-y-4"> {/* Espaçamento geral reduzido */}
      
      {/* --- CABEÇALHO COMPACTO --- */}
      <div className="flex items-center justify-between bg-[#0a0a0a] px-4 py-2 rounded-lg border border-gray-800 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-purple-500/10 rounded-md">
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-gray-100 capitalize">
              {format(startOfCurrentWeek, "d MMM", { locale: ptBR })} - {format(endOfCurrentWeek, "d MMM", { locale: ptBR })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={prevWeek} className="h-7 w-7 hover:bg-gray-800 text-gray-400">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" onClick={resetToToday} className="h-7 px-3 text-[10px] font-bold bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300">
            Hoje
          </Button>
          <Button variant="ghost" size="icon" onClick={nextWeek} className="h-7 w-7 hover:bg-gray-800 text-gray-400">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* --- LISTA DE DIAS (LINHAS COMPACTAS) --- */}
      <div className="flex flex-col space-y-4"> {/* Menos espaço entre os dias */}
        {weekDays.map((day) => {
          const isToday = isSameDay(day, new Date());
          
          const dayEvents = items
            .filter(item => isSameDay(new Date(item.scheduledAt), day))
            .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

          // Se não tiver eventos e não for hoje, podemos esconder ou mostrar muito pequeno?
          // Aqui mantemos mostrando, mas bem compacto.
          
          return (
            <div key={day.toISOString()} className={cn("relative group transition-all duration-500 rounded-xl p-2", isToday ? "bg-purple-900/5 border border-purple-500/10" : "hover:bg-gray-900/20")}>
              
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                
                {/* 1. DATA (Esquerda - Mais estreita) */}
                <div className="md:w-32 flex-shrink-0 flex md:flex-col items-center md:items-start gap-1">
                  <div className={cn("flex items-baseline gap-2 md:flex-col md:gap-0", isToday ? "text-purple-400" : "text-gray-500")}>
                    <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                      {format(day, "EEE", { locale: ptBR })}
                    </span>
                    <span className={cn("text-2xl md:text-3xl font-black leading-none", isToday ? "text-white" : "text-gray-300")}>
                      {format(day, "d")} <span className="text-sm font-medium opacity-50">{format(day, "MMM", { locale: ptBR })}</span>
                    </span>
                  </div>
                  
                  {isToday && (
                    <Badge className="bg-purple-600 text-[9px] h-4 px-1.5 mt-1 border-0 animate-pulse hidden md:flex">
                      HOJE
                    </Badge>
                  )}
                </div>

                {/* 2. ITENS (Direita - Horizontal Compacto) */}
                <div className="flex-1 min-w-0 w-full overflow-hidden">
                  {dayEvents.length === 0 ? (
                    <div className="h-24 border border-dashed border-gray-800/50 rounded-lg bg-gray-900/10 flex items-center justify-center gap-2 text-gray-700 text-xs">
                      <span>Sem agendamento</span>
                    </div>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto pb-2 pt-1 px-1 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                      {dayEvents.map(event => {
                        const isDone = event.isCompleted;

                        return (
                          <Card 
                            key={event.id} 
                            // 👇 Largura reduzida: w-[100px] mobile, w-[120px] desktop
                            className={cn(
                              "flex-shrink-0 w-[100px] md:w-[120px] bg-transparent border-0 shadow-none group/card relative transition-all duration-300",
                              isDone ? "opacity-40 grayscale hover:opacity-100 hover:grayscale-0" : "opacity-100"
                            )}
                          >
                            {/* POSTER (2:3) */}
                            <div className="relative aspect-[2/3] w-full bg-gray-900 rounded-lg overflow-hidden shadow-sm border border-gray-800/50 group-hover/card:border-purple-500/50 transition-colors">
                              
                              {event.media?.posterPath ? (
                                <Image 
                                  src={event.media.posterPath}
                                  alt={event.media.title}
                                  fill
                                  sizes="120px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full bg-gray-800">
                                  <MonitorPlay className="w-6 h-6 text-gray-600" />
                                </div>
                              )}

                              {isDone && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                                  <CheckCircle2 className="w-6 h-6 text-green-500 drop-shadow-md" />
                                </div>
                              )}

                              {!isDone && (
                                <div className="absolute top-1 right-1 opacity-100 z-10">
                                  <Badge className="text-[7px] h-4 px-1 bg-black/80 backdrop-blur-sm border border-white/5 text-white font-bold shadow-sm">
                                      {event.media?.mediaType === "MOVIE" ? "Filme" : 
                                      event.media?.mediaType === "ANIME" ? "Anime" : "Live"}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            
                            {/* Infos Compactas */}
                            <div className="mt-1.5 space-y-0.5">
                              <h4 
                                className={cn(
                                  "font-bold text-[10px] md:text-[11px] leading-tight line-clamp-2 transition-colors",
                                  isDone ? "text-gray-600 line-through decoration-purple-500/30" : "text-gray-300 group-hover/card:text-purple-400"
                                )}
                                title={event.media?.title || event.title || ""}
                              >
                                {event.media?.title || event.title || "Live"}
                              </h4>
                              
                              {(event.seasonNumber || event.episodeNumber) && (
                                <p className="text-[9px] text-gray-600 font-mono flex items-center gap-1.5">
                                  {event.seasonNumber && <span className="bg-gray-800/50 px-1 rounded">S{event.seasonNumber}</span>}
                                  {event.episodeNumber && <span className="text-purple-500">E{event.episodeNumber}</span>}
                                </p>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Separador Sutil */}
              {!isSameDay(day, weekDays[6]) && (
                 <div className="mt-4 border-b border-gray-900/50 w-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}