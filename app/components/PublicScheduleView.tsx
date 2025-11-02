// app/components/PublicScheduleView.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import { ScheduleItem, Media, MediaType } from "@prisma/client";
import Image from "next/image";
import { format, addDays, startOfWeek, isSameDay, differenceInWeeks, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

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
          {item.seasonNumber && `T${item.seasonNumber}`}
          {item.episodeNumber && ` E${item.episodeNumber}`}
          {item.episodeNumberEnd && item.episodeNumberEnd > item.episodeNumber && `-${item.episodeNumberEnd}`}
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
        const res = await fetch(`/api/users/${username}/schedule?weekOffset=${weekOffset}`);
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

  // Memoiza os 7 dias da semana
  const daysOfWeek = useMemo(() => {
    if (!data) return [];
    const startOfThisWeek = new Date(data.weekStart);
    return Array.from({ length: 7 }).map((_, i) => addDays(startOfThisWeek, i));
  }, [data]);

  // Gera o Título da Semana
  const weekTitle = useMemo(() => {
    if (!data) return "A carregar...";
    const start = format(new Date(data.weekStart), "dd/MM");
    const end = format(new Date(data.weekEnd), "dd/MM/yyyy");
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
    const weekOptions = { locale: ptBR, weekStartsOn: 0 as const }; 
    const startOfTodayWeek = startOfWeek(today, weekOptions);
    const startOfSelectedWeek = startOfWeek(date, weekOptions);
    
    const newOffset = differenceInWeeks(startOfSelectedWeek, startOfTodayWeek);

    // --- [ INÍCIO DA MUDANÇA 1 ] ---
    // Garante que o offset não seja menor que -1
    setWeekOffset(Math.max(-1, newOffset));
    // --- [ FIM DA MUDANÇA 1 ] ---
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

            {/* --- [ INÍCIO DA MUDANÇA 2 ] --- */}
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setWeekOffset(w => w - 1)} 
              // Desativa se estiver carregando OU se já estiver na semana -1
              disabled={isLoading || weekOffset <= -1} 
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {/* --- [ FIM DA MUDANÇA 2 ] --- */}

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
            const itemsForThisDay = data?.items.filter(item => 
              isSameDay(new Date(item.scheduledAt), day)
            ) || [];
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