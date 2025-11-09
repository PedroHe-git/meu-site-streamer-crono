"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Clock, Check, X, Plus, Trash2, Loader2, Calendar as CalendarIconLucide } from "lucide-react"; 
import { Calendar as ShadCalendar } from "@/components/ui/calendar";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Tipos
type MediaType = "MOVIE" | "SERIES" | "ANIME" | "OUTROS";
type MediaItem = {
  id: string; 
  mediaId: string;
  title: string;
  mediaType: MediaType; // Corrigido de 'type'
  posterPath: string; 
  status: string;
  isWeekly?: boolean;
  lastSeason?: number;
  lastEpisode?: number;
};

type ScheduleItem = {
  id: string;
  mediaId: string;
  scheduledAt: string; 
  horario: string | null; 
  isCompleted: boolean; 
  season?: number | null;
  episode?: number | null;
  episodeEnd?: number | null;
  media: any; 
};

type ScheduleManagerProps = {
  mediaItems: MediaItem[]; 
  scheduleItems: ScheduleItem[];
  onAddSchedule: (newSchedule: ScheduleItem) => void;
  onRemoveSchedule: (id: string) => void;
  onCompleteSchedule: (id: string) => void;
};

export default function ScheduleManager({
  mediaItems,
  scheduleItems,
  onAddSchedule,
  onRemoveSchedule,
  onCompleteSchedule,
}: ScheduleManagerProps) {
  const [selectedMedia, setSelectedMedia] = useState(""); 
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [scheduleTime, setScheduleTime] = useState("");
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const today = new Date(new Date().setHours(0, 0, 0, 0));

  const getMediaById = (id: string) => mediaItems.find((m) => m.mediaId === id);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedia || !scheduleDate) {
      setError("Selecione uma mídia e uma data.");
      return;
    }
    
    const key = `add-${selectedMedia}`;
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    setError("");

    try {
      const scheduleData = {
        mediaId: selectedMedia, 
        scheduledAt: scheduleDate.toISOString(),
        horario: scheduleTime || null,
      };

      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData),
      });

      if (!res.ok) {
        throw new Error("Falha ao agendar");
      }
      
      const newScheduleItem = await res.json();
      onAddSchedule(newScheduleItem); 
      
      setSelectedMedia("");
      setScheduleDate(undefined);
      setScheduleTime("");
      
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao agendar.");
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleComplete = async (id: string) => {
    const key = `complete-${id}`;
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetch('/api/schedule/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduleItemId: id }), 
      });
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Falha ao completar (API):", errorData);
        throw new Error('Falha ao completar');
      }
      
      onCompleteSchedule(id); 
      
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleRemove = async (id: string) => {
    const key = `remove-${id}`;
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetch(`/api/schedule?id=${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Falha ao remover');

      onRemoveSchedule(id); 

    } catch (error: any) {
      console.error(error.message);
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };
  
  const { upcomingSchedules, completedSchedules } = useMemo(() => {
    if (!Array.isArray(scheduleItems)) return { upcomingSchedules: [], completedSchedules: [] };

    const upcoming = scheduleItems
      .filter(item => !item.isCompleted)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
      
    const completed = scheduleItems
      .filter(item => item.isCompleted)
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

    return { upcomingSchedules: upcoming, completedSchedules: completed };
  }, [scheduleItems]);


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-1 shadow-lg border-2">
        <CardHeader>
          <CardTitle>Agendar Sessão</CardTitle>
          <CardDescription>
            Escolha um item da sua lista "Essa Semana"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSchedule} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="media-select">Mídia</Label>
              <Select
                value={selectedMedia}
                onValueChange={setSelectedMedia}
              >
                <SelectTrigger id="media-select">
                  <SelectValue placeholder="Selecione uma mídia..." />
                </SelectTrigger>
                <SelectContent>
                  {mediaItems.length > 0 ? (
                    mediaItems.map((item) => (
                      <SelectItem key={item.id} value={item.mediaId}>
                        {item.title}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground">
                      Nenhum item em "Essa Semana"
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {/* Calendário - CORRIGIDO */}
              <div className="space-y-2">
                <Label htmlFor="schedule-date">Data</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="schedule-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !scheduleDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {scheduleDate ? format(scheduleDate, "PPP", { locale: ptBR }) : "Escolha uma data"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <ShadCalendar
                      mode="single"
                      selected={scheduleDate}
                      onSelect={(date) => {
                        setScheduleDate(date);
                        setIsCalendarOpen(false);
                      }}
                      disabled={(date) => date < today}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Horário */}
              <div className="space-y-2">
                <Label htmlFor="schedule-time">Horário (Opcional)</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            
            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" disabled={loadingStates[`add-${selectedMedia}`]}>
              {loadingStates[`add-${selectedMedia}`] ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Item
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 shadow-lg border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Próximos Agendamentos</span>
            <Badge>{upcomingSchedules.length}</Badge>
          </CardTitle>
          <CardDescription>
            Itens que você planejou assistir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {upcomingSchedules.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum item agendado.
              </p>
            ) : (
              upcomingSchedules.map((schedule) => {
                const media = getMediaById(schedule.mediaId); 
                if (!media) return null;
                
                const isLoading = loadingStates[`complete-${schedule.id}`] || loadingStates[`remove-${schedule.id}`];

                return (
                  <div
                    key={schedule.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-muted/50 rounded-lg"
                  >
                    <ImageWithFallback
                      src={media.posterPath} 
                      alt={media.title}
                      width={60}
                      height={90}
                      className="rounded-md object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold line-clamp-1">{media.title}</h4>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <CalendarIconLucide className="h-4 w-4" />
                        <span>{formatDate(schedule.scheduledAt)}</span> 
                      </div>
                      {schedule.horario && (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Clock className="h-4 w-4" />
                          <span>{schedule.horario}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground hover:text-red-600"
                        onClick={() => handleRemove(schedule.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleComplete(schedule.id)}
                        disabled={isLoading}
                        className="bg-green-600 text-white hover:bg-green-700 hover:text-white"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        <span className="ml-2 hidden sm:inline">Concluir</span>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
      
      {completedSchedules.length > 0 && (
         <Card className="md:col-span-3 shadow-lg border-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Concluídos Recentemente</span>
              <Badge variant="secondary">{completedSchedules.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {completedSchedules.slice(0, 5).map(schedule => { 
                const media = getMediaById(schedule.mediaId);
                if (!media) return null;

                return (
                  <div
                    key={schedule.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-1">{media.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(schedule.scheduledAt)}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-red-600"
                      onClick={() => handleRemove(schedule.id)}
                      disabled={loadingStates[`remove-${schedule.id}`]}
                    >
                      {loadingStates[`remove-${schedule.id}`] ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}