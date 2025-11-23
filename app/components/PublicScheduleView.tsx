"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Media, ScheduleItem } from "@prisma/client";
import { 
  Loader2, CalendarOff, Clock, Calendar, ChevronLeft, ChevronRight, 
  ListOrdered, Tv, Sparkles 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Separator } from "@/components/ui/separator"; 
import { format, addDays, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ScheduleItemWithMedia = {
  id: string;
  scheduledAt: string | Date;
  horario: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  episodeNumberEnd: number | null;
  isCompleted: boolean;
  media: Media;
};

type PublicScheduleViewProps = {
  username: string;
  initialSchedule: ScheduleItemWithMedia[] | null;
  initialWeekRange: { start: string, end: string } | null;
  initialAiSummary: string | null; 
};

const MIN_WEEK_OFFSET = -1; 

// --- FUNÇÕES DE DATA (UTC FORCE) ---
// Essa função garante que a data seja interpretada como UTC, evitando que volte para o dia anterior
function getUTCDate(dateInput: string | Date): Date {
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
}

// Formatação que usa a data "corrigida"
function formatSimpleDate(dateInput: string | Date) {
  const utcDate = getUTCDate(dateInput);
  return format(utcDate, "PPP", { locale: ptBR }); 
}

const formatHorario = (horario: string | null): string | null => {
  if (horario === "1-Primeiro") return "Primeiro";
  if (horario === "2-Segundo") return "Segundo";
  if (horario === "3-Terceiro") return "Terceiro";
  if (horario === "4-Quarto") return "Quarto";
  if (horario === "5-Quinto") return "Quinto";
  if (horario && horario.match(/^\d{2}:\d{2}$/)) return horario; 
  if (horario) return "Prioridade definida"; 
  return null; 
};

export default function PublicScheduleView({ 
  username, 
  initialSchedule, 
  initialWeekRange,
  initialAiSummary 
}: PublicScheduleViewProps) {
  
  const [scheduleItems, setScheduleItems] = useState<ScheduleItemWithMedia[]>(initialSchedule || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialSchedule ? null : "Perfil privado ou sem dados.");
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekRange, setWeekRange] = useState(initialWeekRange || { start: "", end: "" });

  const fetchSchedule = useCallback(async (offset: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${username}/schedule?weekOffset=${offset}`);
      if (!res.ok) throw new Error("Erro ao carregar.");
      const data = await res.json();
      setScheduleItems(data.items);
      setWeekRange({ start: data.weekStart, end: data.weekEnd });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (weekOffset === 0) {
      setScheduleItems(initialSchedule || []);
      setWeekRange(initialWeekRange || { start: "", end: "" });
      setIsLoading(false);
      return;
    }
    fetchSchedule(weekOffset);
  }, [weekOffset, fetchSchedule, initialSchedule, initialWeekRange]); 

  // --- MAPEAMENTO DE ITENS POR DIA (Usando UTC) ---
  const scheduleMap = useMemo(() => {
    const groups = new Map<string, { date: Date; items: ScheduleItemWithMedia[] }>();
    
    scheduleItems.forEach((item) => {
      if (!item.media) return; 
      
      // Converte para UTC para agrupar corretamente
      const utcDate = getUTCDate(item.scheduledAt);
      const dateKey = utcDate.toDateString(); 
      
      if (!groups.has(dateKey)) {
        groups.set(dateKey, {
          date: utcDate,
          items: [],
        });
      }
      
      const dayItems = groups.get(dateKey)!.items;
      dayItems.push(item);
      
      dayItems.sort((a, b) => {
        if (a.horario && b.horario) return a.horario.localeCompare(b.horario);
        return a.horario ? -1 : 1;
      });
    });
    
    return groups;
  }, [scheduleItems]); 

  // --- GERAÇÃO DOS DIAS DA SEMANA (Segunda -> Domingo) ---
  const allDaysOfWeek = useMemo(() => {
    if (!weekRange.start) return [];
    
    // Pega a data de início da semana (que a API garantiu ser Segunda)
    const start = getUTCDate(weekRange.start);
    
    // Gera 7 dias consecutivos a partir dela
    const days = [];
    for (let i = 0; i < 7; i++) {
        days.push(addDays(start, i));
    }
    
    return days;
  }, [weekRange.start]);

  const formatWeekRange = (start: string, end: string) => {
    if (!start || !end) return "Carregando...";
    // Usa UTC para formatar o título também
    const startDate = getUTCDate(start);
    const endDate = getUTCDate(end);
    
    const startDay = format(startDate, "dd");
    const startMonth = format(startDate, "MMM", { locale: ptBR });
    const endDay = format(endDate, "dd");
    const endMonth = format(endDate, "MMM", { locale: ptBR });
    
    if (startMonth === endMonth) {
      return `Semana de ${startDay} a ${endDay} de ${startMonth}`;
    }
    return `Semana de ${startDay} ${startMonth} a ${endDay} ${endMonth}`;
  };
  
  if (initialSchedule === null) {
    return (
      <div className="text-center p-8 text-muted-foreground"><p>Perfil privado.</p></div>
    );
  }

  return (
    <div className="space-y-8">
      
      {initialAiSummary && weekOffset === 0 && (
        <Alert className="mb-6 border-red-200 bg-gradient-to-r from-red-50 to-green-50 dark:from-red-950/30 dark:to-green-950/30 text-red-800 dark:text-red-200 shadow-sm">
          <Sparkles className="h-4 w-4 text-red-500" />
          <AlertTitle className="flex items-center gap-2">
             O Hype da Semana! <span className="animate-pulse">🎅</span>
          </AlertTitle>
          <AlertDescription>{initialAiSummary}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="outline" size="sm"
          onClick={() => setWeekOffset(weekOffset - 1)}
          disabled={isLoading || weekOffset <= MIN_WEEK_OFFSET}
          className={cn(weekOffset <= MIN_WEEK_OFFSET && "opacity-50 cursor-not-allowed")}
        >
          <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
        </Button>
        
        <div className="text-center">
          <h2 className="text-lg font-semibold capitalize">
            {isLoading ? "A carregar..." : formatWeekRange(weekRange.start, weekRange.end)}
          </h2>
        </div>

        <Button variant="outline" size="sm" onClick={() => setWeekOffset(weekOffset + 1)} disabled={isLoading}>
          Próxima <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {error && !isLoading && <div className="text-center p-8 text-red-600"><p>{error}</p></div>}

      {scheduleItems.length === 0 && !isLoading && !error && (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-muted/50 rounded-lg border border-dashed">
          <CalendarOff className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold">Semana Silenciosa ❄️</h3>
          <p className="text-muted-foreground">Nenhum agendamento encontrado.</p>
        </div>
      )}

      {isLoading && (
         <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && allDaysOfWeek.map((day, index) => {
        // Usa a data UTC para gerar a chave e exibir o título
        const dateKey = day.toDateString(); 
        const dayGroup = scheduleMap.get(dateKey); 

        return (
          <div key={dateKey} className="relative">
            <h2 className="text-2xl font-bold mb-4 capitalize flex items-center gap-2">
              {format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h2>

            {dayGroup ? (
              <Carousel opts={{ align: "start", loop: false }} className="w-full group/carousel">
                <CarouselContent className="-ml-4 pb-8 pt-4"> 
                  {dayGroup.items.map((item) => {
                    const isEpisodic = item.seasonNumber || item.episodeNumber;
                    return (
                      <CarouselItem key={item.id} className={cn("pl-4 basis-1/2 md:basis-1/3 lg:basis-1/5 transition-all", item.isCompleted && "opacity-60 grayscale")}>
                        <div className="p-1 h-full relative group">
                          {isEpisodic && (
                            <div className="xmas-lights">
                                <div className="light"></div><div className="light"></div><div className="light"></div><div className="light"></div>
                            </div>
                          )}
                          {!isEpisodic && (<><div className="snow-top"></div><div className="snow-fall"></div></>)}

                          <Card className={cn("shadow-md h-full flex flex-col relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 border-t-4", isEpisodic ? "border-t-green-600 dark:border-t-green-500" : "border-t-red-500 dark:border-t-red-700")}>
                            <CardContent className="flex flex-col p-0 flex-1">
                              <div className="relative">
                                  <ImageWithFallback src={item.media.posterPath} alt={item.media.title} width={500} height={750} className="w-full h-60 object-cover rounded-t-none" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                              </div>
                              <div className="p-4 space-y-3 flex-1 flex flex-col">
                                <div className="flex items-center justify-between gap-1">
                                  <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-0 font-bold">
                                    {item.media.mediaType === "MOVIE" ? "Filme" : item.media.mediaType === "SERIES" ? "Série" : item.media.mediaType === "ANIME" ? "Anime" : item.media.mediaType === "GAME" ? "Jogo" : "Outro"}
                                  </Badge>
                                  {(item.seasonNumber || item.episodeNumber) && (
                                    <Badge variant="outline" className="flex items-center gap-1 flex-shrink-0 border-red-200 text-red-600 dark:border-red-800 dark:text-red-400 text-[10px]">
                                      <Tv className="h-3 w-3" />
                                      <span>{item.seasonNumber && `S${String(item.seasonNumber).padStart(2, '0')}`}{item.episodeNumber && ` E${String(item.episodeNumber).padStart(2, '0')}`}</span>
                                    </Badge>
                                  )}
                                </div>
                                <h3 className="text-lg font-bold leading-tight line-clamp-2" title={item.media.title}>{item.media.title}</h3>
                                <div className="mt-auto flex flex-col gap-1 text-sm text-muted-foreground pt-2 border-t border-dashed">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-red-500" />
                                    {/* Usa a função formatSimpleDate que corrige o fuso */}
                                    <span className="text-xs">{formatSimpleDate(item.scheduledAt)}</span>
                                  </div>
                                  {item.horario && (
                                    <div className="flex items-center gap-2">
                                      <ListOrdered className="h-3.5 w-3.5 text-green-500" />
                                      <span className="text-xs font-medium text-foreground">{formatHorario(item.horario)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 border-2 border-white bg-red-600 text-white shadow-lg hover:bg-red-700 hover:text-white hover:scale-110 transition-all duration-200"><ChevronLeft className="h-6 w-6" /></CarouselPrevious>
                <CarouselNext className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 border-2 border-white bg-red-600 text-white shadow-lg hover:bg-red-700 hover:text-white hover:scale-110 transition-all duration-200"><ChevronRight className="h-6 w-6" /></CarouselNext>
              </Carousel>
            ) : (
              <Card className="shadow-sm border-dashed border-2 bg-muted/20">
                <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center">
                  <div className="bg-muted p-3 rounded-full mb-3"><Clock className="h-6 w-6 opacity-50" /></div>
                  <p>Nenhum item agendado para este dia.</p>
                </CardContent>
              </Card>
            )}
            {index < allDaysOfWeek.length - 1 && (
              <div className="relative py-8 md:py-12 flex items-center justify-center">
                <Separator className="absolute w-full opacity-50" />
                <div className="relative bg-background px-4 text-muted-foreground"><Sparkles className="h-4 w-4 text-red-300 dark:text-red-800/70 animate-pulse" /></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}