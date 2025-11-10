"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, Film } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Media } from "@prisma/client"; // Importa o tipo Media

// --- [INÍCIO DA CORREÇÃO 1] ---
// Altera os tipos para 'mediaType' e 'scheduledAt: Date'
type MediaType = "MOVIE" | "SERIES" | "ANIME" | "OUTROS";

// O 'ScheduleItem' agora inclui 'media' (como vem da API)
type ScheduleItem = {
  id: string;
  mediaId: string;
  scheduledAt: Date; 
  horario: string | null; 
  isCompleted: boolean; 
  media: Media; // <-- A API já inclui isto
};

// O tipo 'FullCalendarProps' foi simplificado
type FullCalendarProps = { 
  scheduleItems: ScheduleItem[];
  // A prop 'mediaItems' foi REMOVIDA
};
// --- [FIM DA CORREÇÃO 1] ---

export default function FullCalendar({ scheduleItems }: FullCalendarProps) { // Prop 'mediaItems' removida
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- [INÍCIO DA CORREÇÃO 2] ---
  // A função 'getMediaById' foi REMOVIDA
  // --- [FIM DA CORREÇÃO 2] ---


  // --- Lógica do Calendário ---
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayRaw = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay(); 

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
      
      const itemDate = item.scheduledAt; // Já é um objeto Date
      return itemDate.getDate() === day &&
             itemDate.getMonth() === currentDate.getMonth() &&
             itemDate.getFullYear() === currentDate.getFullYear();
    }).sort((a, b) => { 
      if (!a.horario) return 1; 
      if (!b.horario) return -1; 
      return a.horario.localeCompare(b.horario); 
    });
  };

  // Filtra para a lista de "Próximos 7 dias"
  const upcomingSchedules = scheduleItems.filter(schedule => {
    if (schedule.isCompleted) return false; 
    
    const scheduleDate = schedule.scheduledAt; 
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);

    return scheduleDate >= now && scheduleDate < sevenDaysFromNow;
  }).sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()); 

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
                      // --- [INÍCIO DA CORREÇÃO 3] ---
                      // Não precisamos mais do 'getMediaById'
                      const media = schedule.media; 
                      // --- [FIM DA CORREÇÃO 3] ---
                      return (
                        <div
                          key={schedule.id}
                          className="p-1 rounded bg-purple-100 dark:bg-purple-800/50 text-purple-800 dark:text-purple-200"
                        >
                          <p className="text-xs font-medium line-clamp-1">
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
                // --- [INÍCIO DA CORREÇÃO 4] ---
                const media = schedule.media; // Usamos a mídia do 'schedule'
                if (!media) return null;
                // --- [FIM DA CORREÇÃO 4] ---

                const scheduleDate = schedule.scheduledAt; 
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
                      {/* @ts-ignore */}
                      {media.mediaType}
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