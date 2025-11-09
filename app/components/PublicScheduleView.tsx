"use client";

import { useState, useEffect, useMemo } from "react";
import { Media, ScheduleItem } from "@prisma/client";
import { Loader2, CalendarOff, Clock, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Tipos
type ScheduleItemWithMedia = ScheduleItem & { media: Media };

type PublicScheduleViewProps = {
  username: string;
};

// Funções de formatar data
function formatDate(date: Date) {
  return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }); 
}
function formatSimpleDate(date: Date) {
  return format(date, "PPP", { locale: ptBR }); 
}

export default function PublicScheduleView({ username }: PublicScheduleViewProps) {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItemWithMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/users/${username}/simple-schedule`);
        if (!res.ok) {
          throw new Error("Não foi possível carregar o cronograma.");
        }
        const data = await res.json();
        setScheduleItems(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [username]);

  // Lógica de Agrupamento
  const groupedSchedules = useMemo(() => {
    if (scheduleItems.length === 0) return [];
    const groups = new Map<string, { date: Date; items: ScheduleItemWithMedia[] }>();
    scheduleItems.forEach((item) => {
      if (!item.media) return; 
      const dateKey = new Date(item.scheduledAt).toDateString(); 
      if (!groups.has(dateKey)) {
        groups.set(dateKey, {
          date: new Date(item.scheduledAt),
          items: [],
        });
      }
      groups.get(dateKey)!.items.push(item);
    });
    return Array.from(groups.values());
  }, [scheduleItems]); 

  // --- (Estados de Loading, Erro, e Vazio) ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (scheduleItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 bg-muted/50 rounded-lg">
        <CalendarOff className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold">Cronograma Vazio</h3>
        <p className="text-muted-foreground">Este criador ainda não agendou nenhum item.</p>
      </div>
    );
  }

  // --- Layout de Carrossel ---
  return (
    <div className="space-y-8">
      {groupedSchedules.map((dayGroup) => (
        <div key={dayGroup.date.toISOString()}>
          
          <h2 className="text-2xl font-bold mb-4 capitalize">
            {formatDate(dayGroup.date)}
          </h2>

          <Carousel
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {dayGroup.items.map((item) => (
                
                // --- [INÍCIO DA CORREÇÃO] ---
                // Alteramos as classes 'basis' para mostrar mais itens
                <CarouselItem key={item.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/5">
                {/* --- [FIM DA CORREÇÃO] --- */}

                  <div className="p-1">
                    <Card className="shadow-md">
                      <CardContent className="flex flex-col p-0">
                        <ImageWithFallback
                          src={item.media.posterPath}
                          alt={item.media.title}
                          width={500}
                          height={750}
                          className="w-full h-60 object-cover rounded-t-lg"
                        />
                        <div className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">
                              {item.media.mediaType === "MOVIE" ? "Filme" :
                               item.media.mediaType === "SERIES" ? "Série" :
                               item.media.mediaType === "ANIME" ? "Anime" : "Outro"}
                            </Badge>
                            {item.isCompleted && (
                              <Badge className="bg-green-600">Concluído</Badge>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold truncate" title={item.media.title}>
                            {item.media.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{formatSimpleDate(new Date(item.scheduledAt))}</span>
                            </div>
                            {item.horario && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{item.horario}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-[-20px] top-1/2 -translate-y-1/2" />
            <CarouselNext className="absolute right-[-20px] top-1/2 -translate-y-1/2" />
          </Carousel>
        </div>
      ))}
    </div>
  );
}