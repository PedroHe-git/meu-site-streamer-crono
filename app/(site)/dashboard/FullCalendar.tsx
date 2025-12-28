"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WeeklyDialog } from "@/app/components/WeeklyDialog"; // Importar Dialog
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Tipagem simplificada baseada no que vem da API
type ScheduleItem = {
  id: string;
  mediaId: string;
  scheduledAt: string | Date; // API retorna string, Prisma retorna Date
  horario: string | null; 
  isCompleted: boolean;
  isWeekly?: boolean; 
  media: {
    id: string;
    title: string;
    mediaType: string;
    posterPath?: string | null;
  };
};

type FullCalendarProps = { 
  scheduleItems: ScheduleItem[];
};

export default function FullCalendar({ scheduleItems }: FullCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Estados para Lógica de Conclusão e Popout
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [showWeeklyDialog, setShowWeeklyDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);

  const { toast } = useToast();
  const router = useRouter();

  // --- LÓGICA DE COMPLETAR (Reutilizada) ---
  const handleToggleComplete = async (item: ScheduleItem, isFinale?: boolean) => {
    if (loadingIds.has(item.id)) return;

    // Verifica se precisa abrir o Dialog (Series/Animes não finalizados)
    const isSeriesOrAnime = item.media?.mediaType === "SERIES" || item.media?.mediaType === "ANIME";
    
    if (!item.isCompleted && isSeriesOrAnime && isFinale === undefined) {
        setSelectedItem(item);
        setShowWeeklyDialog(true);
        return;
    }

    setLoadingIds(prev => new Set(prev).add(item.id));
    setShowWeeklyDialog(false);

    try {
      const newStatus = !item.isCompleted;
      const res = await fetch("/api/schedule/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            scheduleId: item.id, 
            isCompleted: newStatus,
            isFinale: isFinale 
        }),
      });

      if (!res.ok) throw new Error("Erro");

      toast({
        title: newStatus ? "Concluído!" : "Desmarcado",
        className: newStatus ? "bg-green-600 text-white border-none" : "",
      });
      router.refresh();
    } catch (error) {
      toast({ title: "Erro", variant: "destructive" });
    } finally {
      setLoadingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
      });
      setSelectedItem(null);
    }
  };

  // --- Lógica do Calendário ---
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayRaw = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); 
  const firstDayOfMonthOffset = (firstDayRaw === 0) ? 6 : firstDayRaw - 1;

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
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
      if (item.isCompleted) return false; // Opcional: mostrar ou não concluídos
      const itemDate = new Date(item.scheduledAt);
      return itemDate.getDate() === day &&
             itemDate.getMonth() === currentDate.getMonth() &&
             itemDate.getFullYear() === currentDate.getFullYear();
    }).sort((a, b) => (a.horario || "").localeCompare(b.horario || ""));
  };

  const upcomingSchedules = scheduleItems.filter(schedule => {
    if (schedule.isCompleted) return false;
    const scheduleDate = new Date(schedule.scheduledAt);
    const now = new Date(); now.setHours(0,0,0,0);
    const sevenDaysFromNow = new Date(now); sevenDaysFromNow.setDate(now.getDate() + 7);
    return scheduleDate >= now && scheduleDate < sevenDaysFromNow;
  }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()); 

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Coluna do Calendário */}
      <Card className="lg:col-span-2 shadow-lg border-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</CardTitle>
            <CardDescription>Seu cronograma de entretenimento</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant="outline" onClick={() => changeMonth(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="icon" variant="outline" onClick={() => changeMonth(1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
            {weekDays.map(day => <div key={day} className="font-medium">{day}</div>)}
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
                <div key={dayNumber} className={`h-24 rounded-lg p-2 border overflow-hidden ${isToday ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20" : "bg-muted/50"}`}>
                  <div className={`font-bold text-sm ${isToday ? "text-purple-600" : ""}`}>{dayNumber}</div>
                  <div className="mt-1 space-y-1 overflow-y-auto h-16 scrollbar-none">
                    {schedulesForDay.map(schedule => (
                      <div key={schedule.id} className="p-1 rounded bg-purple-100 dark:bg-purple-800/50 text-purple-800 dark:text-purple-200 text-[10px] truncate" title={schedule.media.title}>
                        {schedule.media.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Coluna da Lista Lateral (Com Botão de Check) */}
      <Card className="lg:col-span-1 shadow-lg border-2">
        <CardHeader>
          <CardTitle>Próximos 7 Dias</CardTitle>
          <CardDescription>Agendamentos que vencem em breve</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingSchedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-12">
              <Calendar className="h-12 w-12 opacity-30 mb-4" />
              <p>Tudo livre nos próximos 7 dias!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {upcomingSchedules.map(schedule => {
                const scheduleDate = new Date(schedule.scheduledAt);
                const isLoading = loadingIds.has(schedule.id);

                return (
                  <div key={schedule.id} className="group flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-all">
                    <div className="flex-shrink-0 text-center w-10">
                      <div className="text-xl font-bold text-purple-600">{scheduleDate.getDate()}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{monthNames[scheduleDate.getMonth()].substring(0, 3)}</div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm line-clamp-1">{schedule.media.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {schedule.horario && <div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span>{schedule.horario}</span></div>}
                      </div>
                    </div>

                    {/* BOTÃO DE CHECK (NOVO) */}
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 hover:bg-green-100 hover:text-green-600"
                        onClick={() => handleToggleComplete(schedule)}
                        disabled={isLoading}
                    >
                        {isLoading ? <span className="animate-spin text-xs">⏳</span> : <Check className="h-4 w-4" />}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIALOG POPOUT */}
      {selectedItem && (
        <WeeklyDialog 
            isOpen={showWeeklyDialog}
            onClose={() => { setShowWeeklyDialog(false); setSelectedItem(null); }}
            onConfirm={(isFinale) => handleToggleComplete(selectedItem, isFinale)}
            title={selectedItem.media.title}
        />
      )}
    </div>
  );
}