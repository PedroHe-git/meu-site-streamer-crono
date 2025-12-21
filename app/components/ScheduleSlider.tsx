'use client';

import { useState, useEffect } from 'react';
import { 
  format, 
  addWeeks, 
  subWeeks, 
  startOfWeek, 
  endOfWeek, 
  isSameDay, 
  addDays,
  isWithinInterval,
  getDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import Image from 'next/image';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi, // Importamos o tipo da API do carrossel
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";

type ScheduleEvent = {
  id: string;
  scheduledAt: Date | string;
  horario: string | null;
  media?: {
    title: string;
    posterPath: string | null;
    mediaType: string;
  } | null;
  user?: {
    name: string | null;
    image: string | null;
    twitchUsername: string | null;
  } | null;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
};

interface ScheduleSliderProps {
  events: ScheduleEvent[];
}

export default function ScheduleSlider({ events }: ScheduleSliderProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [api, setApi] = useState<CarouselApi>(); // Estado para controlar o carrossel

  // Calcula o início e fim da semana selecionada (Segunda a Domingo)
  const startOfCurrentWeek = startOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });
  const endOfCurrentWeek = endOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });

  // Gera os 7 dias da semana
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));

  // --- LÓGICA INTELIGENTE DE SCROLL ---
  useEffect(() => {
    if (!api) return;

    const today = new Date();
    // Verifica se a semana que estamos vendo é a semana atual (do mundo real)
    const isCurrentWeek = isWithinInterval(today, { start: startOfCurrentWeek, end: endOfCurrentWeek });

    if (isCurrentWeek) {
      // Se for a semana atual, calcula o índice de hoje (0=Segunda, 6=Domingo)
      // O getDay() retorna 0 para Domingo e 1 para Segunda. Precisamos ajustar.
      let todayIndex = getDay(today) - 1; 
      if (todayIndex < 0) todayIndex = 6; // Se for Domingo (-1), vira 6

      // Rola suavemente para o dia de hoje
      api.scrollTo(todayIndex);
    } else {
      // Se for outra semana (futura ou passada), sempre volta para o início (Segunda)
      api.scrollTo(0);
    }
  }, [api, startOfCurrentWeek, endOfCurrentWeek]); // Executa quando a API carrega ou mudamos a semana

  // Navegação
  const nextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));
  const prevWeek = () => setCurrentDate(prev => subWeeks(prev, 1));
  const resetToToday = () => setCurrentDate(new Date());

  return (
    <div className="w-full space-y-6">
      
      {/* Controles Superiores */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
             <CalendarIcon className="w-5 h-5 text-purple-400" />
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

      {/* Carrossel Principal */}
      <Carousel 
        setApi={setApi} // Conecta a API aqui
        opts={{ align: "start", loop: false }} 
        className="w-full select-none"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date());
            
            // Filtra eventos deste dia
            const dayEvents = events.filter(event => 
              isSameDay(new Date(event.scheduledAt), day)
            );

            return (
              <CarouselItem key={day.toISOString()} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <div 
                  className={`
                    h-full flex flex-col rounded-xl border transition-colors duration-300
                    ${isToday 
                      ? 'border-purple-500 bg-gradient-to-b from-purple-900/20 to-gray-900/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                      : 'border-gray-800 bg-gray-900/40 hover:border-gray-700'
                    }
                  `}
                >
                  
                  {/* Cabeçalho do Dia */}
                  <div className={`p-4 border-b ${isToday ? 'border-purple-500/30' : 'border-gray-800'}`}>
                    <div className="flex justify-between items-center mb-1">
                        <p className={`text-sm font-bold uppercase tracking-wider ${isToday ? 'text-purple-400' : 'text-gray-500'}`}>
                        {format(day, 'EEEE', { locale: ptBR })}
                        </p>
                        {isToday && <Badge className="bg-purple-600 text-[10px] h-5">HOJE</Badge>}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-black ${isToday ? 'text-white' : 'text-gray-300'}`}>
                        {format(day, 'd')}
                      </span>
                      <span className="text-sm text-gray-500 capitalize">
                        {format(day, 'MMM', { locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  {/* Lista de Eventos */}
                  <div className="flex-1 p-3 space-y-3 min-h-[180px]">
                    {dayEvents.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-700 gap-2 opacity-60">
                         <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                            <CalendarIcon className="w-4 h-4" />
                         </div>
                         <span className="text-xs font-medium">Sem lives</span>
                      </div>
                    ) : (
                      dayEvents.map(event => (
                        <Card key={event.id} className="bg-gray-800 border-0 overflow-hidden group hover:ring-1 hover:ring-purple-500 transition-all shadow-lg">
                          {/* Área da Imagem - Mais compacta */}
                          <div className="relative aspect-[16/9] w-full bg-gray-900">
                            {event.media?.posterPath ? (
                              <Image 
                                src={event.media.posterPath.startsWith('http') ? event.media.posterPath : `https://image.tmdb.org/t/p/w500${event.media.posterPath}`}
                                alt={event.media.title}
                                fill
                                className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full bg-gray-700">
                                <span className="text-xs text-gray-400">Sem Capa</span>
                              </div>
                            )}
                            {/* Horário sobre a imagem */}
                            <div className="absolute bottom-0 right-0 bg-black/80 px-2 py-1 rounded-tl-lg backdrop-blur-sm">
                              <p className="text-xs font-bold text-purple-300 font-mono">
                                {event.horario || format(new Date(event.scheduledAt), 'HH:mm')}h
                              </p>
                            </div>
                          </div>
                          
                          <CardContent className="p-3">
                            <h4 className="font-bold text-sm line-clamp-1 text-gray-100 mb-1" title={event.media?.title}>
                                {event.media?.title || "Live Especial"}
                            </h4>
                            <div className="flex flex-wrap gap-1">
                                <Badge variant="secondary" className="text-[10px] h-5 px-1 bg-gray-700 text-gray-300">
                                    {event.media?.mediaType === 'MOVIE' ? 'Filme' : event.media?.mediaType === 'GAME' ? 'Jogo' : 'Live'}
                                </Badge>
                                {(event.seasonNumber && event.episodeNumber) && (
                                    <span className="text-[10px] text-yellow-500 font-mono bg-yellow-500/10 px-1 rounded flex items-center">
                                        S{event.seasonNumber} E{event.episodeNumber}
                                    </span>
                                )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>

                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        {/* Setas de Navegação do Carrossel (ocultas em mobile para limpar a tela) */}
        <CarouselPrevious className="hidden md:flex -left-4 border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:border-purple-500" />
        <CarouselNext className="hidden md:flex -right-4 border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:border-purple-500" />
      </Carousel>
    </div>
  );
}