"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, Film } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// --- TIPOS ---
type MediaItem = {
  id: string; // ID do MediaStatus
  // --- [INÍCIO DA CORREÇÃO 1] ---
  // Adiciona o mediaId, que é o que recebemos do page.tsx
  // e é o que precisamos para fazer a ligação.
  mediaId: string; 
  // --- [FIM DA CORREÇÃO 1] ---
  title: string;
  type: "MOVIE" | "SERIES" | "ANIME" | "OUTROS";
  posterPath: string; 
  status: string;
};

type ScheduleItem = {
  id: string;
  mediaId: string; // Esta é a chave de ligação
  scheduledAt: string; 
  horario: string | null; 
  isCompleted: boolean; 
};

type FullCalendarProps = { 
  scheduleItems: ScheduleItem[];
  mediaItems: MediaItem[]; // Este prop recebe MappedMediaItem[] do page.tsx
};
// --- FIM DOS TIPOS ---

export default function FullCalendar({ scheduleItems, mediaItems }: FullCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- [INÍCIO DA CORREÇÃO 2] ---
  // Corrigido de 'm.id === id' para 'm.mediaId === id'
  // Agora, ele compara o mediaId do agendamento com o mediaId da lista de médias.
  const getMediaById = (id: string) => {
    return mediaItems.find(m => m.mediaId === id);
  };
  // --- [FIM DA CORREÇÃO 2] ---

  // --- Lógica do Calendário (CORRIGIDA) ---
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayRaw = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay(); // 0 = Domingo, 1 = Segunda, ...

  const firstDayOfMonthOffset = (firstDayRaw === 0) ? 6 : firstDayRaw - 1;

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  
  const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const changeMonth = (amount: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + amount);
      return newDate;
    });
  };

  const getSchedulesForDay = (day: number) => {
    return scheduleItems.filter(item => {
      if (item.isCompleted) return false; 
      
      // Usar UTC para evitar bugs de fuso horário
      const itemDate = new Date(item.scheduledAt);
      const itemUTCDate = new Date(Date.UTC(itemDate.getUTCFullYear(), itemDate.getUTCMonth(), itemDate.getUTCDate()));
      
      return itemUTCDate.getUTCDate() === day &&
             itemUTCDate.getUTCMonth() === currentDate.getMonth() &&
             itemUTCDate.getUTCFullYear() === currentDate.getFullYear();
    }).sort((a, b) => { 
      if (!a.horario) return 1; 
      if (!b.horario) return -1; 
      return a.horario.localeCompare(b.horario); 
    });
  };

  const upcomingSchedules = scheduleItems.filter(schedule => {
    if (schedule.isCompleted) return false; 
    
    const scheduleDate = new Date(schedule.scheduledAt); 
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);

    return scheduleDate >= now && scheduleDate < sevenDaysFromNow;
  }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()); 

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Coluna do Calendário */}
      <Card className="lg:col-span-2 shadow-lg border-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <CardDescription>
              Seu cronograma de entretenimento
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant="outline" onClick={() => changeMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={() => changeMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
            {weekDays.map(day => (
              <div key={day} className="font-medium">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonthOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 rounded-lg bg-muted/30"></div>
            ))}

            {Array.from({ length: daysInMonth }).map((_, day) => {
              const dayNumber = day + 1;
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
              const isToday = date.getTime() === today.getTime();
              const schedulesForDay = getSchedulesForDay(dayNumber);

              return (
                <div
                  key={dayNumber}
                  className={`h-24 rounded-lg p-2 border overflow-hidden ${isToday ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20" : "bg-muted/50"}`}
                >
                  <div className={`font-bold text-sm ${isToday ? "text-purple-600" : ""}`}>
                    {dayNumber}
                  </div>
                  <div className="mt-1 space-y-1 overflow-y-auto h-16">
                    {schedulesForDay.map(schedule => {
                      const media = getMediaById(schedule.mediaId);
                      return (
                        <div
                          key={schedule.id}
                          className="p-1 rounded bg-purple-100 dark:bg-purple-800/50 text-purple-800 dark:text-purple-200"
                        >
                          <p className="text-xs font-medium line-clamp-1">
                            {/* Agora 'media?.title' irá funcionar corretamente */}
                            {media?.title || "Mídia removida"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Coluna da Agenda (Próximos 7 dias) */}
      <Card className="lg:col-span-1 shadow-lg border-2">
        <CardHeader>
          <CardTitle>Próximos 7 Dias</CardTitle>
          <CardDescription>
            Agendamentos que vencem em breve
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingSchedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-12">
              <Calendar className="h-12 w-12 opacity-30 mb-4" />
              <p className="font-semibold">Nenhum agendamento</p>
              <p className="text-sm">Tudo livre nos próximos 7 dias!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {upcomingSchedules.map(schedule => {
                const media = getMediaById(schedule.mediaId);
                if (!media) return null;

                const scheduleDate = new Date(schedule.scheduledAt); 
                const now = new Date();
                const isThisWeek = scheduleDate.getTime() >= now.getTime() && scheduleDate.getTime() < new Date(now.setDate(now.getDate() + 7)).getTime();

                return (
                  <div
                    key={schedule.id}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-background hover:bg-muted/50 hover:border-purple-300 transition-all"
                  >
                    <div className="flex-shrink-0 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {scheduleDate.getDate()}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase">
                        {monthNames[scheduleDate.getMonth()].substring(0, 3)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold mb-1 line-clamp-1">{media.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {schedule.horario && ( 
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{schedule.horario}</span> 
                          </div>
                        )}
                        {isThisWeek && (
                          <Badge className="bg-purple-600">Essa Semana</Badge>
                        )}
                      </div>
                    </div>

                    <Badge variant="outline" className="flex-shrink-0">
                      {media.type}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}