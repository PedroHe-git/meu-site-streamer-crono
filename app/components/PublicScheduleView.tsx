// app/components/PublicScheduleView.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import { ScheduleItem, Media } from "@prisma/client";
import Image from "next/image";
// [MUDANÇA 1: Importar 'parse']
import { format, addDays, startOfWeek, isSameDay, differenceInWeeks, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
// [MUDANÇA 2: REMOVIDA a linha 'date-fns-tz' que causava o erro]

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
  weekStart: string; // Agora é "yyyy-MM-dd"
  weekEnd: string;   // Agora é "yyyy-MM-dd"
};

// Componente para um único item da lista (sem mudanças)
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
        // [MUDANÇA 3: Manter o 'cache-buster' para garantir que não há cache]
        const cacheBuster = `&cb=${new Date().getTime()}`;
        const res = await fetch(
          `/api/users/${username}/schedule?weekOffset=${weekOffset}${cacheBuster}`, 
          { cache: 'no-store' }
        );

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Não foi possível carregar o cronograma.");
        }
        const data: ScheduleData = await res.json();
        setData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchedule();
  }, [username, weekOffset]);

  // [MUDANÇA 4: Usar 'parse' para ler a data 'yyyy-MM-dd' como local]
  const startOfThisWeekDate = useMemo(() => {
    if (!data) return null;
    // Converte a string "2025-11-02" para um objeto Date
    // que representa a meia-noite LOCAL (corrigindo o bug do Sábado)
    return parse(data.weekStart, 'yyyy-MM-dd', new Date());
  }, [data]);

  // Memoiza os 7 dias da semana
  const daysOfWeek = useMemo(() => {
    if (!startOfThisWeekDate) return [];
    return Array.from({ length: 7 }).map((_, i) => addDays(startOfThisWeekDate, i));
  }, [startOfThisWeekDate]); // Depende da data corrigida

  // Gera o Título da Semana
  const weekTitle = useMemo(() => {
    if (!data) return "A carregar...";
    // [MUDANÇA 5: Usar 'parse' também para formatar o título]
    const start = format(parse(data.weekStart, 'yyyy-MM-dd', new Date()), "dd/MM");
    const end = format(parse(data.weekEnd, 'yyyy-MM-dd', new Date()), "dd/MM/yyyy");
    if (weekOffset === 0) return "Semana Atual";
    if (weekOffset === -1) return "Semana Passada";
    if (weekOffset === 1) return "Próxima Semana";
    return `Semana de ${start} a ${end}`;
  }, [data, weekOffset]);

  // Lógica do Date Picker
  const handleDateSelect = (date: Date | null) => {
    if (!date) return;
    const today = new Date();
    // [MUDANÇA 6: Remover 'locale' do cálculo (igual à API)]
    const weekOptions = { weekStartsOn: 0 as const }; 
    const startOfTodayWeek = startOfWeek(today, weekOptions);
    const startOfSelectedWeek = startOfWeek(date, weekOptions);
    
    const newOffset = differenceInWeeks(startOfSelectedWeek, startOfTodayWeek);
    setWeekOffset(newOffset);
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
              selected={startOfThisWeekDate} // [MUDANÇA 7: Usar a data corrigida]
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
              disabled={isLoading}
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
          daysOfWeek.map(day => {
            const itemsForThisDay = data?.items.filter(item => {
              // 'item.scheduledAt' é um ISO String (ex: 2025-11-03T14:00:00.000Z)
              // new Date() converte-o para o fuso local automaticamente
              const scheduledDate = new Date(item.scheduledAt);
              return isSameDay(scheduledDate, day);
            }) || [];
            
            const pendingItems = itemsForThisDay.filter(item => !item.isCompleted);
            const completedItems = itemsForThisDay.filter(item => item.isCompleted);

            return (
              <div key={day.toString()}>
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