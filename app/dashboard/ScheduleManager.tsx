"use client";

import { useState, useMemo, useEffect } from "react"; 
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Clock, Check, Plus, Trash2, Loader2, Calendar as CalendarIconLucide, ListVideo, Tv } from "lucide-react"; 
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
} from "@/components/ui/alert-dialog"; 

// Tipos
type MediaType = "MOVIE" | "SERIES" | "ANIME" | "OUTROS";
type MediaItem = {
  id: string; 
  userId: string;
  mediaId: string;
  title: string;
  mediaType: MediaType; 
  posterPath: string; 
  status: string;
  isWeekly?: boolean;
  lastSeason?: number;
  lastEpisode?: number;
};

type ScheduleItem = {
  id: string;
  userId: string;
  mediaId: string;
  scheduledAt: Date; 
  horario: string | null; 
  isCompleted: boolean; 
  seasonNumber: number | null; 
  episodeNumber: number | null; 
  episodeNumberEnd: number | null; 
  media: any; 
};

type ScheduleManagerProps = {
  mediaItems: MediaItem[]; 
  scheduleItems: ScheduleItem[];
  onAddSchedule: (newSchedule: ScheduleItem) => void;
  onRemoveSchedule: (id: string) => void;
  onCompleteSchedule: (id: string) => void;
};

// Função formatHorario
const formatHorario = (horario: string | null): string | null => {
  if (horario === "1-Primeiro") return "Primeiro";
  if (horario === "2-Segundo") return "Segundo";
  if (horario === "3-Terceiro") return "Terceiro";
  if (horario === "4-Quarto") return "Quarto";
  if (horario === "5-Quinto") return "Quinto";
  if (horario) return horario; 
  return null; 
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
  
  const [season, setSeason] = useState("");
  const [episode, setEpisode] = useState("");

  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const today = new Date(new Date().setHours(0, 0, 0, 0));

  const getMediaById = (id: string) => mediaItems.find((m) => m.mediaId === id);

  const formatDate = (date: Date) => { 
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  };

  const selectedMediaInfo = useMemo(() => {
    if (!selectedMedia) return null;
    return mediaItems.find(m => m.mediaId === selectedMedia);
  }, [selectedMedia, mediaItems]);

  const showEpisodeFields = selectedMediaInfo && (selectedMediaInfo.mediaType === 'SERIES' || selectedMediaInfo.mediaType === 'ANIME');

  useEffect(() => {
    if (selectedMediaInfo && showEpisodeFields) {
      const nextSeason = selectedMediaInfo.lastSeason || 1;
      const nextEpisode = (selectedMediaInfo.lastEpisode || 0) + 1;
      
      setSeason(String(nextSeason));
      setEpisode(String(nextEpisode));
    } else {
      setSeason("");
      setEpisode("");
    }
  }, [selectedMediaInfo, showEpisodeFields]); 


  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); 
    
    if (!selectedMedia || !scheduleDate) {
      setError("Selecione uma mídia e uma data.");
      return;
    }
    
    // --- [INÍCIO DA CORREÇÃO] ---
    // Removemos a validação que obrigava o preenchimento de S/E
    /*
    if (showEpisodeFields && (!season || !episode)) {
      setError("Para Séries/Animes, Temporada e Episódio são obrigatórios.");
      return;
    }
    */
    // --- [FIM DA CORREÇÃO] ---
    
    const key = `add-${selectedMedia}`;
    setLoadingStates(prev => ({ ...prev, [key]: true }));

    try {
      const horarioParaSalvar = (scheduleTime === "qualquer" || !scheduleTime) ? null : scheduleTime;

      // O código aqui já trata 'season' ou 'episode' vazios como 'null',
      // o que é perfeito para campos opcionais.
      const scheduleData = {
        mediaId: selectedMedia, 
        scheduledAt: scheduleDate.toISOString(),
        horario: horarioParaSalvar, 
        seasonNumber: season ? parseInt(season) : null, 
        episodeNumber: episode ? parseInt(episode) : null,
        episodeNumberEnd: null, 
      };

      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData),
      });

      if (!res.ok) {
        throw new Error("Falha ao agendar");
      }
      
      const newScheduleItemRaw = await res.json();
      
      const newScheduleItem: ScheduleItem = {
        ...newScheduleItemRaw,
        scheduledAt: new Date(newScheduleItemRaw.scheduledAt)
      };
      
      onAddSchedule(newScheduleItem); 
      
      setSelectedMedia("");
      setScheduleDate(undefined);
      setScheduleTime("");
      setSeason("");
      setEpisode("");
      
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
      .sort((a, b) => {
        const dateA = new Date(a.scheduledAt).setHours(0, 0, 0, 0);
        const dateB = new Date(b.scheduledAt).setHours(0, 0, 0, 0);
        if (dateA !== dateB) {
          return dateA - dateB; 
        }
        
        if (a.horario && b.horario) {
          return a.horario.localeCompare(b.horario); 
        }
        
        if (a.horario) return -1; 
        if (b.horario) return 1;  

        return 0; 
      });
      
    const completed = scheduleItems
      .filter(item => item.isCompleted)
      .sort((a, b) => {
        const dateA = new Date(a.scheduledAt).setHours(0, 0, 0, 0);
        const dateB = new Date(b.scheduledAt).setHours(0, 0, 0, 0);
        if (dateA !== dateB) {
          return dateB - dateA; 
        }

        if (a.horario && b.horario) {
          return a.horario.localeCompare(b.horario); 
        }
        
        if (a.horario) return -1; 
        if (b.horario) return 1;  
        
        return 0;
      });

    return { upcomingSchedules: upcoming, completedSchedules: completed };
  }, [scheduleItems]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Coluna 1: Stack Vertical para o Formulário e a Nova Lista */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Card 1: Formulário de Agendamento */}
        <Card className="shadow-lg border-2">
          <CardHeader>
            <CardTitle>Agendar Sessão</CardTitle>
            <CardDescription>
              Escolha um item da sua lista &quot;Essa Semana&quot;
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
                        Nenhum item em &quot;Essa Semana&quot;
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {/* Calendário */}
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
                
                {/* Inputs de S/E (visíveis condicionalmente) */}
                {showEpisodeFields && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="season-number">Temporada (Opc.)</Label>
                      <Input
                        id="season-number"
                        type="number"
                        placeholder="S"
                        value={season}
                        onChange={(e) => setSeason(e.target.value)}
                        min="1"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="episode-number">Episódio (Opc.)</Label>
                      <Input
                        id="episode-number"
                        type="number"
                        placeholder="Ep"
                        value={episode}
                        onChange={(e) => setEpisode(e.target.value)}
                        min="1"
                        className="h-9"
                      />
                    </div>
                  </div>
                )}

                {/* Select de Prioridade */}
                <div className="space-y-2">
                  <Label htmlFor="schedule-priority">Ordem de Visualização (Opcional)</Label>
                  <Select
                    value={scheduleTime}
                    onValueChange={setScheduleTime}
                  >
                    <SelectTrigger id="schedule-priority" className="h-9">
                      <SelectValue placeholder="Qualquer Hora (Sem ordem)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qualquer">Qualquer Hora (Sem ordem)</SelectItem>
                      <SelectItem value="1-Primeiro">Primeiro</SelectItem>
                      <SelectItem value="2-Segundo">Segundo</SelectItem>
                      <SelectItem value="3-Terceiro">Terceiro</SelectItem>
                      <SelectItem value="4-Quarto">Quarto</SelectItem>
                      <SelectItem value="5-Quinto">Quinto</SelectItem>
                    </SelectContent>
                  </Select>
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

        {/* Card 2: Lista de Itens Disponíveis */}
        <Card className="shadow-lg border-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Disponíveis para Agendar</span>
              <Badge>{mediaItems.length}</Badge>
            </CardTitle>
            <CardDescription>
              Itens da sua lista "Essa Semana".
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {mediaItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                  <ListVideo className="h-10 w-10 mb-2 opacity-50" />
                  <p>Nenhum item em &quot;Essa Semana&quot;.</p>
                  <p className="text-xs">Adicione itens na aba "Minhas Listas".</p>
                </div>
              ) : (
                mediaItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <ImageWithFallback
                      src={item.posterPath} 
                      alt={item.title}
                      width={40}
                      height={60}
                      className="rounded-md object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-2">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.isWeekly ? "Episódio Semanal" : "Item Único"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* --- Fim da Coluna 1 --- */}


      {/* Coluna 2: Próximos Agendamentos */}
      <Card className="lg:col-span-2 shadow-lg border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Próximos Agendamentos</span>
            <Badge>{upcomingSchedules.length}</Badge>
          </CardTitle>
          <CardDescription>
            Itens que você planejou assistir (incluindo atrasados).
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
                const isLoading = loadingStates[`complete-${schedule.id}`] || loadingStates[`remove-${schedule.id}`];

                if (!media) {
                  return (
                    <div
                      key={schedule.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-destructive line-clamp-1">Mídia Removida ou Corrompida</h4>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <CalendarIconLucide className="h-4 w-4" />
                          <span>{formatDate(schedule.scheduledAt)}</span> 
                        </div>
                        {schedule.horario && (
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Clock className="h-4 w-4" />
                            <span>{formatHorario(schedule.horario)}</span>
                          </div>
                        )}
                        <p className="text-xs text-destructive/80 mt-1">Este item agendado não está em nenhuma lista. Pode removê-lo.</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-muted-foreground hover:text-red-600"
                          onClick={() => handleRemove(schedule.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="outline" disabled={true}>
                          <Check className="h-4 w-4" />
                          <span className="ml-2 hidden sm:inline">Concluir</span>
                        </Button>
                      </div>
                    </div>
                  );
                }

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
                          <span>{formatHorario(schedule.horario)}</span>
                        </div>
                      )}
                      {(schedule.seasonNumber || schedule.episodeNumber) && (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                          <Tv className="h-4 w-4" />
                          <span>
                            {schedule.seasonNumber && `S${String(schedule.seasonNumber).padStart(2, '0')}`}
                            {schedule.episodeNumber && ` E${String(schedule.episodeNumber).padStart(2, '0')}`}
                          </span>
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
      {/* Fim da Coluna 2 */}

      
      {/* Coluna 3: Concluídos Recentemente */}
      {completedSchedules.length > 0 && (
         <Card className="lg:col-span-3 shadow-lg border-2"> 
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