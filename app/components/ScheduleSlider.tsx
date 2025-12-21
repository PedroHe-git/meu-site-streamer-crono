// app/components/ScheduleSlider.tsx
'use client';

import { useState } from 'react';
import { 
  format, 
  addWeeks, 
  subWeeks, 
  startOfWeek, 
  endOfWeek, 
  isSameDay, 
  addDays 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import Image from 'next/image';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";

// ... (Mantenha as interfaces/types iguais) ...
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

  // 👇 MUDANÇA AQUI: weekStartsOn: 1 força a semana a começar na Segunda
  const startOfCurrentWeek = startOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });
  const endOfCurrentWeek = endOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });

  const nextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));
  const prevWeek = () => setCurrentDate(prev => subWeeks(prev, 1));
  const resetToToday = () => setCurrentDate(new Date());

  // Gera os 7 dias a partir da Segunda-feira
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));

  return (
    <div className="w-full space-y-6">
      
      {/* Controles */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-purple-400" />
          <span className="text-lg font-bold text-gray-200 capitalize">
            {format(startOfCurrentWeek, "d 'de' MMM", { locale: ptBR })} - {format(endOfCurrentWeek, "d 'de' MMM", { locale: ptBR })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevWeek} className="border-gray-700 hover:bg-gray-800 text-white">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" onClick={resetToToday} className="text-xs font-bold">
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={nextWeek} className="border-gray-700 hover:bg-gray-800 text-white">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Carrossel */}
      <Carousel opts={{ align: "start", loop: false }} className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date());
            
            // Filtra eventos deste dia
            const dayEvents = events.filter(event => 
              isSameDay(new Date(event.scheduledAt), day)
            );

            return (
              <CarouselItem key={day.toISOString()} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <div className={`h-full flex flex-col rounded-xl border ${isToday ? 'border-purple-500 bg-purple-900/10' : 'border-gray-800 bg-gray-900/40'}`}>
                  
                  {/* Cabeçalho do Card */}
                  <div className={`p-4 border-b ${isToday ? 'border-purple-500/30' : 'border-gray-800'}`}>
                    <p className="text-sm font-medium text-gray-400 capitalize">
                      {format(day, 'EEEE', { locale: ptBR })}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-100">
                        {format(day, 'd')}
                      </span>
                      <span className="text-sm text-gray-500 capitalize">
                        {format(day, 'MMM', { locale: ptBR })}
                      </span>
                      {isToday && <Badge className="ml-auto bg-purple-600">Hoje</Badge>}
                    </div>
                  </div>

                  {/* Lista de Eventos */}
                  <div className="flex-1 p-3 space-y-3 min-h-[200px]">
                    {dayEvents.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2 min-h-[150px]">
                         <span className="text-2xl opacity-20">💤</span>
                         <span className="text-xs">Off</span>
                      </div>
                    ) : (
                      dayEvents.map(event => (
                        <Card key={event.id} className="bg-gray-800 border-0 overflow-hidden group hover:ring-1 hover:ring-purple-500 transition-all">
                          <div className="relative aspect-video w-full bg-gray-900">
                            {event.media?.posterPath ? (
                              <Image 
                                src={event.media.posterPath.startsWith('http') ? event.media.posterPath : `https://image.tmdb.org/t/p/w500${event.media.posterPath}`}
                                alt={event.media.title}
                                fill
                                className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full bg-gray-700">
                                <span className="text-xs text-gray-400">Sem Capa</span>
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                              <p className="text-xs font-bold text-purple-300">
                                {event.horario || format(new Date(event.scheduledAt), 'HH:mm')}h
                              </p>
                            </div>
                          </div>
                          <CardContent className="p-3">
                            <h4 className="font-bold text-sm line-clamp-1 text-gray-100" title={event.media?.title}>
                                {event.media?.title || "Live Especial"}
                            </h4>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-[10px] h-5 px-1">
                                    {event.media?.mediaType || "LIVE"}
                                </Badge>
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
        <CarouselPrevious className="hidden md:flex -left-4 border-gray-700 bg-gray-800 text-white hover:bg-gray-700" />
        <CarouselNext className="hidden md:flex -right-4 border-gray-700 bg-gray-800 text-white hover:bg-gray-700" />
      </Carousel>
    </div>
  );
}