// app/components/PublicScheduleView.tsx
// CORREÇÕES APLICADAS:
// 1. Uso consistente de UTC para evitar problemas de fuso horário
// 2. Garantir que sábado apareça corretamente
// 3. Logs para debug em produção

"use client";

import { useEffect, useState, useMemo } from "react";
import { ScheduleItem, Media, MediaType } from "@prisma/client";
import Image from "next/image";
import { format, addDays, startOfWeek, isSameDay, differenceInWeeks, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; 

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"; 
import { cn } from "@/lib/utils";

registerLocale("pt-BR", ptBR);

type ScheduleItemWithMedia = ScheduleItem & { media: Media };

interface Props {
  username: string;
}

type ScheduleData = {
  items: ScheduleItemWithMedia[];
  weekStart: string;
  weekEnd: string;
};

// Componente para um único item da lista
function ScheduleListItem({ item, isCompleted }: { item: ScheduleItemWithMedia; isCompleted: boolean }) {
  return (
    <div className={cn(
      "flex items-start gap-3",
      isCompleted && "opacity-60"
    )}>
      <Image
        src={item.media.posterPath || "/placeholder.png"}
        alt={item.media.title}
        width={40}
        height={60}
        className="rounded-sm object-cover w-10 h-15 flex-shrink-0"
        unoptimized
      />
      <div className="flex-grow">
        <h4 className={cn(
          "font-semibold text-foreground",
          isCompleted && "line-through"
        )}>
          {item.media.title}
        </h4>
        <p className="text-sm text-primary font-medium">
          {item.seasonNumber !== null && `T${item.seasonNumber}`}
          {item.episodeNumber !== null && ` E${item.episodeNumber}`}
          {item.episodeNumberEnd !== null && item.episodeNumber !== null && item.episodeNumberEnd > item.episodeNumber && `-${item.episodeNumberEnd}`}
        </p>
      </div>
      {item.horario && (
        <span className="text-sm font-medium text-muted-foreground flex-shrink-0">{item.horario}</span>
      )}
    </div>
  );
}


export default function PublicScheduleView({ username }: Props) {
  const [data, setData] = useState<ScheduleData | null>(null);
  const [weekOffset, setWeekOffset] = useState(0); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect para buscar os dados
  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/users/${username}/schedule?weekOffset=${weekOffset}`, {
          cache: 'no-store'
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Não foi possível carregar o cronograma.");
        }
        const data: ScheduleData = await res.json();
        
        // LOG DE DEBUG - remova após confirmar que funciona
        console.log('📅 Dados recebidos:', {
          weekStart: data.weekStart,
          weekEnd: data.weekEnd,
          totalItems: data.items.length,
          itemsByDay: data.items.reduce((acc, item) => {
            const day = format(parseISO(item.scheduledAt as any), 'EEEE', { locale: ptBR });
            acc[day] = (acc[day] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        });
        
        setData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchedule();
  }, [username, weekOffset]);

  // --- MUDANÇA CRÍTICA: Usar startOfDay para garantir comparação correta ---
  const daysOfWeek = useMemo(() => {
    if (!data) return [];
    
    // Parsear a data do servidor como UTC
    const startOfThisWeek = parseISO(data.weekStart);
    
    // LOG DE DEBUG
    console.log('📅 Gerando dias da semana:', {
      weekStart: data.weekStart,
      parsed: startOfThisWeek,
      dayOfWeek: format(startOfThisWeek, 'EEEE', { locale: ptBR })
    });
    
    // Gerar os 7 dias
    const days = Array.from({ length: 7 }).map((_, i) => {
      const day = addDays(startOfThisWeek, i);
      
      // LOG DE DEBUG - remova após confirmar
      if (i === 6) { // Sábado (último dia se começar no domingo)
        console.log('📅 Sábado:', {
          date: format(day, 'dd/MM/yyyy'),
          dayName: format(day, 'EEEE', { locale: ptBR }),
          iso: day.toISOString()
        });
      }
      
      return day;
    });
    
    return days;
  }, [data]);

  // Gera o Título da Semana
  const weekTitle = useMemo(() => {
    if (!data) return "A carregar...";
    const start = format(parseISO(data.weekStart), "dd/MM");
    const end = format(parseISO(data.weekEnd), "dd/MM/yyyy");
    if (weekOffset === 0) return "Semana Atual";
    if (weekOffset === -1) return "Semana Passada";
    if (weekOffset === 1) return "Próxima Semana";
    return `Semana de ${start} a ${end}`;
  }, [data, weekOffset]);

  // Lógica do Date Picker
  const currentWeekStartDate = useMemo(() => {
    return data ? parseISO(data.weekStart) : new Date();
  }, [data]);

  const handleDateSelect = (date: Date | null) => {
    if (!date) return;
    const today = new Date();
    const weekOptions = {weekStartsOn: 0 as const }; 
    const startOfTodayWeek = startOfWeek(today, weekOptions);
    const startOfSelectedWeek = startOfWeek(date, weekOptions);
    
    const newOffset = differenceInWeeks(startOfSelectedWeek, startOfTodayWeek);
    setWeekOffset(Math.max(-1, newOffset));
  };

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <CardTitle className="text-2xl md:text-3xl text-primary">
            Cronograma
            <span className="text-lg md:text-xl text-muted-foreground ml-2">
              ({weekTitle})
            </span>
          </CardTitle>

          <div className="flex gap-2">
            <DatePicker
              selected={currentWeekStartDate}
              onChange={handleDateSelect}
              locale="pt-BR"
              dateFormat="dd/MM/yyyy"
              customInput={
                <Button variant="outline" size="icon" disabled={isLoading} title="Selecionar data">
                  <CalendarIcon className="w-4 h-4" />
                </Button>
              }
            />
            
            {weekOffset !== 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekOffset(0)}
                disabled={isLoading}
                className="h-9 px-3"
              >
                Voltar à Semana Atual
              </Button>
            )}

            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setWeekOffset(w => w - 1)} 
              disabled={isLoading || weekOffset <= -1} 
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setWeekOffset(w => w + 1)} 
              disabled={isLoading}
              title="Próxima semana"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">A carregar semana...</div>
        ) : (
          daysOfWeek.map((day, index) => {
            // --- MUDANÇA CRÍTICA: Comparar usando apenas a data, sem hora ---
            const dayStart = new Date(day);
            dayStart.setHours(0, 0, 0, 0);
            
            const itemsForThisDay = data?.items.filter(item => {
              const itemDate = new Date(item.scheduledAt);
              itemDate.setHours(0, 0, 0, 0);
              return itemDate.getTime() === dayStart.getTime();
            }) || [];
            
            // LOG DE DEBUG para sábado
            if (index === 6) {
              console.log('📅 Itens do Sábado:', {
                date: format(day, 'dd/MM/yyyy'),
                dayName: format(day, 'EEEE', { locale: ptBR }),
                itemCount: itemsForThisDay.length,
                items: itemsForThisDay.map(i => ({
                  title: i.media.title,
                  scheduledAt: i.scheduledAt,
                  completed: i.isCompleted
                }))
              });
            }
            
            const pendingItems = itemsForThisDay.filter(item => !item.isCompleted);
            const completedItems = itemsForThisDay.filter(item => item.isCompleted);

            return (
              <div key={day.toISOString()}>
                <h3 className="text-lg font-semibold mb-3 capitalize text-foreground">
                  {format(day, "EEEE", { locale: ptBR })}
                  <span className="text-base text-muted-foreground font-normal ml-2">
                    ({format(day, "dd/MM")})
                  </span>
                </h3>
                
                <div className="pl-4 border-l-2 border-border space-y-3">
                  {pendingItems.length > 0 && (
                    <div className="space-y-3">
                      {pendingItems.map(item => (
                        <ScheduleListItem key={item.id} item={item} isCompleted={false} />
                      ))}
                    </div>
                  )}
                  {completedItems.length > 0 && (
                    <>
                      {pendingItems.length > 0 && (
                        <div className="flex items-center gap-2 pt-2">
                          <span className="text-xs font-medium text-muted-foreground">Histórico</span>
                          <Separator className="flex-1" />
                        </div>
                      )}
                      <div className="space-y-3">
                        {completedItems.map(item => (
                          <ScheduleListItem key={item.id} item={item} isCompleted={true} />
                        ))}
                      </div>
                    </>
                  )}
                  {pendingItems.length === 0 && completedItems.length === 0 && (
                     <p className="text-muted-foreground text-sm">Nenhum item agendado.</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}