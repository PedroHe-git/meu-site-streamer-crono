"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, RotateCcw, MonitorPlay } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ScheduleItem {
  id: string;
  title?: string | null;
  scheduledAt: string | Date;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [api, setApi] = useState<CarouselApi>();

  // Calcula início e fim da semana selecionada (Segunda a Domingo)
  const startOfCurrentWeek = startOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });
  const endOfCurrentWeek = endOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });

  // Gera os 7 dias da semana
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));

  // Scroll automático para o dia atual
  useEffect(() => {
    if (!api) return;

    const today = new Date();
    const isCurrentWeek = weekDays.some(day => isSameDay(day, today));

    if (isCurrentWeek) {
      // Encontra o índice do dia atual (0=Segunda, 6=Domingo)
      const todayIndex = weekDays.findIndex(day => isSameDay(day, today));
      if (todayIndex !== -1) {
        api.scrollTo(todayIndex);
      }
    } else {
      // Se for outra semana, volta para o início (Segunda)
      api.scrollTo(0);
    }
  }, [api, weekDays]);

  // Navegação
  const nextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));
  const prevWeek = () => setCurrentDate(prev => subWeeks(prev, 1));
  const resetToToday = () => setCurrentDate(new Date());

  return (
    <div className="relative w-full max-w-7xl mx-auto space-y-6">
      
      {/* Controles de Navegação de Semana */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Visualizando</p>
            <span className="text-lg font-bold text-gray-100 capitalize">
              {format(startOfCurrentWeek, "d 'de' MMM", { locale: ptBR })} - {format(endOfCurrentWeek, "d 'de' MMM", { locale: ptBR })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-950 p-1 rounded-lg border border-gray-800">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={prevWeek} 
            className="hover:bg-gray-800 text-gray-400 hover:text-white"
            title="Semana Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="secondary" 
            onClick={resetToToday} 
            className="h-8 px-4 text-xs font-bold bg-gray-800 hover:bg-gray-700 border border-gray-700"
          >
            <RotateCcw className="w-3 h-3 mr-2" />
            Hoje
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={nextWeek} 
            className="hover:bg-gray-800 text-gray-400 hover:text-white"
            title="Próxima Semana"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Carrossel com todos os dias da semana */}
      <Carousel 
        setApi={setApi}
        opts={{ align: "start", loop: false }} 
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date());
            const isPast = day < new Date() && !isToday;
            
            // Filtra eventos deste dia específico (incluindo dias passados)
            const dayEvents = items.filter(item => {
              const itemDate = new Date(item.scheduledAt);
              return isSameDay(itemDate, day);
            });

            return (
              <CarouselItem key={day.toISOString()} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <div 
                  className={cn(
                    "h-full flex flex-col rounded-xl border transition-colors duration-300",
                    isToday 
                      ? "border-purple-500 bg-gradient-to-b from-purple-900/20 to-gray-900/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]" 
                      : isPast
                      ? "border-gray-800 bg-gray-900/20 opacity-75"
                      : "border-gray-800 bg-gray-900/40 hover:border-gray-700"
                  )}
                >
                  
                  {/* Cabeçalho do Dia */}
                  <div className={cn("p-4 border-b", isToday ? "border-purple-500/30" : "border-gray-800")}>
                    <div className="flex justify-between items-center mb-1">
                      <p className={cn("text-sm font-bold uppercase tracking-wider", isToday ? "text-purple-400" : "text-gray-500")}>
                        {format(day, "EEEE", { locale: ptBR })}
                      </p>
                      {isToday && <Badge className="bg-purple-600 text-[10px] h-5">HOJE</Badge>}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className={cn("text-3xl font-black", isToday ? "text-white" : "text-gray-300")}>
                        {format(day, "d")}
                      </span>
                      <span className="text-sm text-gray-500 capitalize">
                        {format(day, "MMM", { locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  {/* Lista de Eventos do Dia */}
                  <div className="flex-1 p-3 space-y-3 min-h-[200px]">
                    {dayEvents.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-700 gap-2 opacity-60">
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-medium">Sem lives</span>
                      </div>
                    ) : (
                      dayEvents.map(event => {
                        const eventDate = new Date(event.scheduledAt);
                        
                        return (
                          <Card key={event.id} className="bg-gray-800 border-0 overflow-hidden group hover:ring-1 hover:ring-purple-500 transition-all shadow-lg">
                            {/* Área da Imagem */}
                            <div className="relative aspect-[16/9] w-full bg-gray-900">
                              {event.media?.posterPath ? (
                                <Image 
                                  src={event.media.posterPath}
                                  alt={event.media.title}
                                  fill
                                  className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full bg-gray-700">
                                  <MonitorPlay className="w-12 h-12 text-gray-600" />
                                </div>
                              )}
                            </div>
                            
                            <CardContent className="p-3 space-y-2">
                              <h4 className="font-bold text-sm line-clamp-1 text-gray-100" title={event.media?.title}>
                                {event.media?.title || event.title || "Live Especial"}
                              </h4>
                              
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="secondary" className="text-[10px] h-5 px-1 bg-gray-700 text-gray-300">
                                  {event.media?.mediaType === "MOVIE" ? "Filme" : 
                                   event.media?.mediaType === "ANIME" ? "Anime" : "Live"}
                                </Badge>
                                
                                {(event.seasonNumber || event.episodeNumber) && (
                                  <Badge className="text-[10px] h-5 px-1 bg-yellow-500/10 text-yellow-500 border-yellow-500/20 font-mono">
                                    {event.seasonNumber && `S${event.seasonNumber}`}
                                    {event.seasonNumber && event.episodeNumber && " "}
                                    {event.episodeNumber && `E${event.episodeNumber}`}
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>

                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        
        {/* Setas de Navegação */}
        <CarouselPrevious className="hidden md:flex -left-4 border-gray-700 bg-gray-800/80 backdrop-blur-sm text-white hover:bg-purple-600 hover:border-purple-500" />
        <CarouselNext className="hidden md:flex -right-4 border-gray-700 bg-gray-800/80 backdrop-blur-sm text-white hover:bg-purple-600 hover:border-purple-500" />
      </Carousel>
    </div>
  );
}