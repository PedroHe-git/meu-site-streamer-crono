"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Media, ScheduleItem } from "@prisma/client";
import { Loader2, CalendarOff, Clock, Calendar, ChevronLeft, ChevronRight, ListOrdered, Tv } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { format, addDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils"; 

// Tipos
type ScheduleItemWithMedia = ScheduleItem & { media: Media };

// --- Props Atualizadas ---
type PublicScheduleViewProps = {
  username: string;
  // Recebe os dados iniciais da semana 0 (do Server Component)
  initialSchedule: ScheduleItemWithMedia[] | null;
  initialWeekRange: { start: string, end: string } | null;
};
// --- Fim das Props ---

// Funções de Data (Corrigidas para UTC)
function getUTCDate(dateString: string | Date): Date {
  const date = new Date(dateString);
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
}

function formatDate(date: Date) {
  return format(getUTCDate(date), "EEEE, dd 'de' MMMM", { locale: ptBR }); 
}
function formatSimpleDate(date: Date) {
  return format(getUTCDate(date), "PPP", { locale: ptBR }); 
}

function parseDateString(dateString: string) {
    return new Date(dateString + 'T12:00:00'); // Meio-dia local
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
  initialWeekRange 
}: PublicScheduleViewProps) {
  
  // --- Estados Atualizados ---
  // Inicia os estados com os dados recebidos do servidor
  const [scheduleItems, setScheduleItems] = useState<ScheduleItemWithMedia[]>(initialSchedule || []);
  const [isLoading, setIsLoading] = useState(false); // Começa como 'false'
  const [error, setError] = useState<string | null>(initialSchedule ? null : "Perfil privado ou sem dados.");

  const [weekOffset, setWeekOffset] = useState(0); // Sempre começa na semana 0
  const [weekRange, setWeekRange] = useState(initialWeekRange || { start: "", end: "" });
  // --- Fim dos Estados ---


  // --- Lógica de Fetch (Agora em useCallback) ---
  const fetchSchedule = useCallback(async (offset: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${username}/schedule?weekOffset=${offset}`);
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
  }, [username]); // Depende apenas do username

  // --- useEffect Atualizado ---
  useEffect(() => {
    // Se for a semana 0, os dados já foram carregados (initialSchedule).
    // Não faz nada.
    if (weekOffset === 0) {
      // Garante que os dados iniciais sejam carregados se o usuário navegar de volta
      setScheduleItems(initialSchedule || []);
      setWeekRange(initialWeekRange || { start: "", end: "" });
      setIsLoading(false);
      setError(null);
      return;
    }
    
    // Se for qualquer outra semana, busca os dados da API
    fetchSchedule(weekOffset);

  }, [weekOffset, fetchSchedule, initialSchedule, initialWeekRange]); 
  // --- Fim do useEffect ---


  // Gera um MAPA dos agendamentos (Sem alteração)
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
      const dayItems = groups.get(dateKey)!.items;
      dayItems.push(item);
      dayItems.sort((a, b) => {
        if (a.horario && b.horario) return a.horario.localeCompare(b.horario);
        return a.horario ? -1 : 1;
      });
    });
    return groups;
  }, [scheduleItems]); 

  // Gera um ARRAY com todos os 7 dias da semana (Sem alteração)
  const allDaysOfWeek = useMemo(() => {
    if (!weekRange.start || !weekRange.end) {
      return [];
    }
    const startDate = parseDateString(weekRange.start);
    const endDate = parseDateString(weekRange.end);
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [weekRange]);

  // Formatação do título da semana (Sem alteração)
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
  
  // --- [LÓGICA DE RENDERIZAÇÃO ATUALIZADA] ---
  // Se 'initialSchedule' for nulo, significa que o perfil é privado.
  if (initialSchedule === null) {
    // Não precisa mais do 'Lock' aqui, pois o ProfilePage já trata isso.
    // Mas é uma boa garantia.
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>O cronograma deste utilizador é privado.</p>
      </div>
    );
  }

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
            {isLoading ? "A carregar..." : formatWeekRange(weekRange.start, weekRange.end)}
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

      {/* Estado de Erro */}
      {error && !isLoading && (
        <div className="text-center p-8 text-red-600">
          <p>{error}</p>
        </div>
      )}

      {/* Estado Vazio (se a API retornar vazio) */}
      {scheduleItems.length === 0 && !isLoading && !error && (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-muted/50 rounded-lg">
          <CalendarOff className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">Cronograma Vazio</h3>
          <p className="text-muted-foreground">Este criador não agendou nenhum item {weekOffset === 0 ? "esta semana" : "nesta semana"}.</p>
        </div>
      )}

      {/* Spinner de carregamento (para as semanas > 0) */}
      {isLoading && (
         <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Renderização dos dias (apenas se não estiver carregando) */}
      {!isLoading && allDaysOfWeek.map((day) => {
        const dayKey = day.toDateString(); 
        const dayGroup = scheduleMap.get(dayKey); 

        return (
          <div key={dayKey}>
            <h2 className="text-2xl font-bold mb-4 capitalize">
              {format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h2>

            {dayGroup ? (
              <Carousel
                opts={{ align: "start", loop: false }}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {dayGroup.items.map((item) => (
                    <CarouselItem 
                      key={item.id} 
                      className={cn(
                        "pl-4 basis-1/2 md:basis-1/3 lg:basis-1/5 transition-all",
                        item.isCompleted && "opacity-60 grayscale"
                      )}
                    >
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
                              
                              <div className="flex items-center justify-between gap-1">
                                <Badge variant="outline">
                                  {item.media.mediaType === "MOVIE" ? "Filme" :
                                   item.media.mediaType === "SERIES" ? "Série" :
                                   item.media.mediaType === "ANIME" ? "Anime" : "Outro"}
                                </Badge>
                                
                                {(item.seasonNumber || item.episodeNumber) && (
                                  <Badge variant="outline" 
                                    className="flex items-center gap-1 flex-shrink-0 border-purple-500 text-purple-500 dark:border-purple-400 dark:text-purple-400">
                                    <Tv className="h-3 w-3" />
                                    <span>
                                      {item.seasonNumber && `S${String(item.seasonNumber).padStart(2, '0')}`}
                                      {item.episodeNumber && ` E${String(item.episodeNumber).padStart(2, '0')}`}
                                    </span>
                                  </Badge>
                                )}
                              </div>

                              <h3 className="text-lg font-semibold truncate" title={item.media.title}>
                                {item.media.title}
                              </h3>
                              
                              <div className="flex flex-col items-start gap-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatSimpleDate(new Date(item.scheduledAt))}</span>
                                </div>
                                {item.horario && (
                                  <div className="flex items-center gap-2">
                                    <ListOrdered className="h-4 w-4" />
                                    <span>{formatHorario(item.horario)}</span>
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
                <CarouselPrevious className="absolute left-[-20px] top-1/2 -translate-y-1/2 bg-background border-2 text-foreground/80 hover:text-foreground hover:bg-accent" />
                <CarouselNext className="absolute right-[-20px] top-1/2 -translate-y-1/2 bg-background border-2 text-foreground/80 hover:text-foreground hover:bg-accent" />
              </Carousel>
            
            ) : (
              // Placeholder de dia vazio
              <Card className="shadow-sm border-dashed">
                <CardContent className="p-6 text-center text-muted-foreground">
                  <p>Nenhum item agendado para este dia.</p>
                </CardContent>
              </Card>
            )}
          </div>
        );
      })}

    </div>
  );
}