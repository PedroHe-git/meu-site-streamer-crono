"use client";

import { useState, useEffect, useMemo } from "react";
import { Media, ScheduleItem } from "@prisma/client";
import { Loader2, CalendarOff, Clock, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
// --- [MUDANÇA 1] ---
// Importa 'eachDayOfInterval' para gerar os 7 dias da semana
import { format, addDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
// --- [FIM MUDANÇA 1] ---
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

// Funções de Data (Corrigidas para UTC)
function getUTCDate(dateString: string | Date) {
  const date = new Date(dateString);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
function formatDate(date: Date) {
  return format(getUTCDate(date), "EEEE, dd 'de' MMMM", { locale: ptBR }); 
}
function formatSimpleDate(date: Date) {
  return format(getUTCDate(date), "PPP", { locale: ptBR }); 
}
// Converte "YYYY-MM-DD" para um objeto Date local sem bugs de fuso
function parseDateString(dateString: string) {
    return new Date(dateString + 'T00:00:00');
}


export default function PublicScheduleView({ username }: PublicScheduleViewProps) {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItemWithMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [weekOffset, setWeekOffset] = useState(0);
  const [weekRange, setWeekRange] = useState({ start: "", end: "" });

  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/users/${username}/schedule?weekOffset=${weekOffset}`);
        if (!res.ok) {
          throw new Error("Não foi possível carregar o cronograma.");
        }
        
        const data = await res.json();
        setScheduleItems(data.items);
        setWeekRange({ start: data.weekStart, end: data.weekEnd });
        
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [username, weekOffset]); 

  // --- [MUDANÇA 2] ---
  // Gera um MAPA dos agendamentos para consulta rápida
  // A chave é a data (string), o valor são os itens daquele dia
  const scheduleMap = useMemo(() => {
    const groups = new Map<string, { date: Date; items: ScheduleItemWithMedia[] }>();
    scheduleItems.forEach((item) => {
      if (!item.media) return; 
      const dateKey = getUTCDate(item.scheduledAt).toDateString(); 
      if (!groups.has(dateKey)) {
        groups.set(dateKey, {
          date: new Date(item.scheduledAt),
          items: [],
        });
      }
      // Ordena os itens por horário (nulls por último)
      const dayItems = groups.get(dateKey)!.items;
      dayItems.push(item);
      dayItems.sort((a, b) => {
        if (a.horario && b.horario) return a.horario.localeCompare(b.horario);
        return a.horario ? -1 : 1;
      });
    });
    return groups;
  }, [scheduleItems]); 

  // Gera um ARRAY com todos os 7 dias da semana atual
  const allDaysOfWeek = useMemo(() => {
    if (!weekRange.start || !weekRange.end) {
      return [];
    }
    const startDate = parseDateString(weekRange.start);
    const endDate = parseDateString(weekRange.end);
    
    // Gera um array [Seg, Ter, Qua, Qui, Sex, Sab, Dom]
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [weekRange]);
  // --- [FIM MUDANÇA 2] ---

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

  // Formatação do título da semana (função interna)
  const formatWeekRange = (start: string, end: string) => {
    if (!start || !end) return "Carregando...";
    
    const startDate = parseDateString(start); 
    const endDate = parseDateString(end);

    const startDay = format(startDate, "dd");
    const startMonth = format(startDate, "MMM", { locale: ptBR });
    const endDay = format(endDate, "dd");
    const endMonth = format(endDate, "MMM", { locale: ptBR });

    if (startMonth === endMonth) {
      return `Semana de ${startDay} a ${endDay} de ${startMonth}`;
    }
    return `Semana de ${startDay} ${startMonth} a ${endDay} ${endMonth}`;
  };

  return (
    <div className="space-y-8">
      
      {/* Botões de Navegação da Semana */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setWeekOffset(weekOffset - 1)}
          disabled={isLoading}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        
        <div className="text-center">
          <h2 className="text-lg font-semibold capitalize">
            {formatWeekRange(weekRange.start, weekRange.end)}
          </h2>
        </div>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setWeekOffset(weekOffset + 1)}
          disabled={isLoading}
        >
          Próxima
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Mensagem de Vazio (se a API não retornar nada) */}
      {scheduleItems.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-muted/50 rounded-lg">
          <CalendarOff className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">Cronograma Vazio</h3>
          <p className="text-muted-foreground">Este criador não agendou nenhum item {weekOffset === 0 ? "esta semana" : "nesta semana"}.</p>
        </div>
      )}

      {/* --- [MUDANÇA 3] --- */}
      {/* Mapeia os 7 dias da semana (allDaysOfWeek) em vez de apenas os dias com itens */}
      {allDaysOfWeek.map((day) => {
        const dayKey = day.toDateString();
        // Procura os itens para este dia no Mapa
        const dayGroup = scheduleMap.get(dayKey); 

        return (
          <div key={dayKey}>
            <h2 className="text-2xl font-bold mb-4 capitalize">
              {formatDate(day)}
            </h2>

            {/* Se houver itens (dayGroup existe), renderiza o Carrossel */}
            {dayGroup ? (
              <Carousel
                opts={{ align: "start", loop: false }}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {dayGroup.items.map((item) => (
                    <CarouselItem key={item.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/5">
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
            
            ) : (
              // Se NÃO houver itens (dayGroup não existe), renderiza um placeholder
              <Card className="shadow-sm border-dashed">
                <CardContent className="p-6 text-center text-muted-foreground">
                  <p>Nenhum item agendado para este dia.</p>
                </CardContent>
              </Card>
            )}
          </div>
        );
      })}
      {/* --- [FIM MUDANÇA 3] --- */}

    </div>
  );
}