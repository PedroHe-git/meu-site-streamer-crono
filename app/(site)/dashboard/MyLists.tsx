"use client";

import { useState, useEffect, useCallback } from "react";
import { Media, MediaStatus } from "@prisma/client";
import { 
  Loader2, Trash2, CheckCircle2, PlayCircle, Plus, MoreVertical, 
  ChevronLeft, ChevronRight, Calendar, Trophy, Eye, Search 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // 👈 Import do Input
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { cn } from "@/lib/utils";

type MediaStatusWithMedia = MediaStatus & { media: Media };

interface MyListsProps {
  onDataChanged: () => void;
  dataVersionKey: number;
}

export default function MyLists({ onDataChanged, dataVersionKey }: MyListsProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("WATCHING");
  const [items, setItems] = useState<MediaStatusWithMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  
  // Estado de Pesquisa
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 16;
  const [totalItems, setTotalItems] = useState(0);

  const [counts, setCounts] = useState({
    WATCHING: 0,
    TO_WATCH: 0,
    WATCHED: 0,
    DROPPED: 0
  });

  // Debounce da pesquisa (espera 500ms antes de buscar)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reseta a página quando troca a aba ou o termo de busca
  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [activeTab, debouncedSearch]);

  // --- Helper: Calcula a MAIOR temporada marcada como TRUE no JSON ---
  const getLastCompletedSeason = (progress: any) => {
    if (!progress) return null;
    const seasons = Object.entries(progress)
      .filter(([_, isWatched]) => isWatched === true)
      .map(([season]) => parseInt(season))
      .sort((a, b) => b - a);
    return seasons.length > 0 ? seasons[0] : null;
  };

  const fetchAllCounts = useCallback(async () => {
    const statuses = ["WATCHING", "TO_WATCH", "WATCHED", "DROPPED"];
    try {
      const promises = statuses.map(s =>
        fetch(`/api/mediastatus?status=${s}&page=1&pageSize=16`)
          .then(r => r.json())
      );
      const results = await Promise.all(promises);
      setCounts({
        WATCHING: results[0].total || 0,
        TO_WATCH: results[1].total || 0,
        WATCHED: results[2].total || 0,
        DROPPED: results[3].total || 0,
      });
    } catch (error) {
      console.error("Erro ao buscar contadores", error);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    try {
      // 👇 Adicionado filtro de searchTerm na URL
      const res = await fetch(
        `/api/mediastatus?status=${activeTab}&page=${page}&pageSize=${pageSize}&searchTerm=${encodeURIComponent(debouncedSearch)}`
      );
      if (!res.ok) throw new Error("Erro ao buscar lista");
      const data = await res.json();

      setItems(data.items || []);
      setTotalItems(data.total || 0);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar lista.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, pageSize, debouncedSearch, toast]);

  // Dispara a busca quando muda: Aba, Página, Termo (Debounced) ou Versão dos Dados
  useEffect(() => {
    fetchList();
    fetchAllCounts();
  }, [fetchList, fetchAllCounts, dataVersionKey]);

  const handleToggleWeekly = async (id: string, currentIsWeekly: boolean) => {
    setIsActionLoading(id);
    try {
      const res = await fetch(`/api/mediastatus`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isWeekly: !currentIsWeekly }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");

      toast({
        title: !currentIsWeekly ? "Marcado como Semanal" : "Removido do Semanal",
        description: !currentIsWeekly ? "Este item aparecerá na sua agenda semanal." : "Item removido da agenda semanal."
      });
      onDataChanged();
    } catch (error) {
      toast({ title: "Erro", variant: "destructive" });
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleMove = async (id: string, newStatus: string) => {
    setIsActionLoading(id);
    try {
      const res = await fetch(`/api/mediastatus`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) throw new Error("Erro ao mover");

      toast({ 
          title: "Movido!", 
          description: `Item movido para ${newStatus === "WATCHING" ? "Assistindo" : newStatus === "WATCHED" ? "Concluídos" : "Para Assistir"}` 
      });
      
      onDataChanged();
    } catch (error) {
      toast({ title: "Erro", variant: "destructive" });
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover da lista?")) return;
    setIsActionLoading(id);
    try {
      const res = await fetch(`/api/mediastatus?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao deletar");

      toast({ title: "Removido", description: "Item removido da lista." });
      onDataChanged();
    } catch (error) {
      toast({ title: "Erro", variant: "destructive" });
    } finally {
      setIsActionLoading(null);
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  const renderTabTrigger = (value: string, label: string, count: number) => (
    <TabsTrigger value={value} className="text-xs px-3 py-1.5 gap-2">
      {label}
      <Badge variant="secondary" className="bg-black/20 text-[10px] h-4 px-1.5 hover:bg-black/30">
        {count}
      </Badge>
    </TabsTrigger>
  );

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* CABEÇALHO COM ABAS E PESQUISA */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
          <TabsList className="bg-muted/50 p-1 h-auto w-full sm:w-auto overflow-x-auto">
            {renderTabTrigger("WATCHING", "Essa Semana", counts.WATCHING)}
            {renderTabTrigger("TO_WATCH", "Para Assistir", counts.TO_WATCH)}
            {renderTabTrigger("WATCHED", "Concluídos", counts.WATCHED)}
            {renderTabTrigger("DROPPED", "Dropados", counts.DROPPED)}
          </TabsList>

          {/* BARRA DE PESQUISA */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 bg-background/50 border-input focus:bg-background transition-colors"
            />
          </div>
        </div>

        <div className="min-h-[300px]">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 border border-dashed rounded-xl bg-muted/10">
              <p className="text-sm text-muted-foreground">
                {searchTerm ? `Nenhum resultado para "${searchTerm}"` : "Esta lista está vazia."}
              </p>
            </div>
          ) : (
            <TabsContent value={activeTab} className="mt-0 space-y-6">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 animate-in fade-in">
                {items.map((item) => {
                  const isSeriesOrAnime = item.media.mediaType === "SERIES" || item.media.mediaType === "ANIME";

                  // LÓGICA DE TEMPORADAS CORRIGIDA
                  const completedSeason = getLastCompletedSeason(item.seasonProgress);
                  const currentTracking = item.lastSeasonWatched || completedSeason;

                  return (
                    <div key={item.id} className="group relative flex flex-col gap-1.5">
                      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-border bg-muted shadow-sm transition-all hover:ring-2 hover:ring-primary/50">
                        {item.media.posterPath ? (
                            <Image
                              src={item.media.posterPath}
                              alt={item.media.title}
                              fill
                              sizes="(max-width: 768px) 33vw, 15vw"
                              className={cn(
                                "object-cover transition-transform duration-300 group-hover:scale-105",
                                isActionLoading === item.id && "opacity-50 grayscale"
                              )}
                              unoptimized={true}
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
                              <PlayCircle className="w-8 h-8 opacity-20" />
                            </div>
                        )}

                        {/* BADGES E ETIQUETAS */}
                        <div className="absolute top-1 right-1 pointer-events-none z-10">
                          <Badge variant="secondary" className="text-[8px] h-4 px-1 bg-black/70 backdrop-blur border-0 text-white font-normal">
                            {item.media.mediaType === "MOVIE" ? "Filme" : item.media.mediaType === "ANIME" ? "Anime" : item.media.mediaType === "GAME" ? "Jogo" : "Série"}
                          </Badge>
                        </div>

                        {item.isWeekly && (
                          <div className="absolute top-1 left-1 pointer-events-none z-10">
                            <Badge className="bg-purple-600/90 hover:bg-purple-600 text-[8px] h-4 px-1 border-0 text-white font-bold shadow-sm">
                              SEMANAL
                            </Badge>
                          </div>
                        )}

                        {/* MENU DE AÇÕES */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-end justify-start p-2 z-20">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-black/50 hover:bg-white text-white hover:text-black border-0 backdrop-blur-sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleToggleWeekly(item.id, item.isWeekly)}>
                                <Calendar className="w-4 h-4 mr-2" />
                                {item.isWeekly ? "Remover do Semanal" : "Marcar como Semanal"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleMove(item.id, "WATCHING")}>
                                <PlayCircle className="w-4 h-4 mr-2" /> Essa Semana
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMove(item.id, "TO_WATCH")}>
                                <Plus className="w-4 h-4 mr-2" /> Para Assistir
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMove(item.id, "WATCHED")}>
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Concluído
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-red-500 focus:text-red-500">
                                <Trash2 className="w-4 h-4 mr-2" /> Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* VISUALIZAÇÃO DE PROGRESSO */}
                        {isSeriesOrAnime && (
                          <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex justify-center z-10">
                            {(() => {
                                // Lógica de Exibição das Badges
                                if (activeTab === "WATCHED") {
                                    if (completedSeason) {
                                        return (
                                           <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full backdrop-blur-md border shadow-sm bg-green-500/20 border-green-500/40 text-green-100">
                                             <Trophy className="w-3 h-3 text-yellow-500" />
                                             <span className="text-[9px] font-bold uppercase tracking-wide">
                                                S{completedSeason} Completa
                                             </span>
                                           </div>
                                        );
                                    } else {
                                        return (
                                           <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full backdrop-blur-md border shadow-sm bg-gray-600/50 border-gray-500/30 text-gray-200">
                                             <span className="text-[9px] font-medium uppercase">Concluído</span>
                                           </div>
                                        );
                                    }
                                } 
                                else {
                                    if (currentTracking) {
                                        return (
                                           <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full backdrop-blur-md border shadow-sm bg-purple-600/80 border-purple-400/30 text-white">
                                             <Eye className="w-3 h-3" />
                                             <span className="text-[9px] font-bold uppercase tracking-wide">
                                                Vendo Temp. {currentTracking}
                                             </span>
                                           </div>
                                        );
                                    } else {
                                        return (
                                           <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-800/80 border border-gray-700 rounded-full backdrop-blur-md">
                                              <span className="text-[9px] font-medium text-gray-300 uppercase">Assistindo</span>
                                           </div>
                                        );
                                    }
                                }
                            })()}
                          </div>
                        )}
                      </div>

                      <div className="px-0.5">
                        <h4 className="text-[11px] font-medium leading-tight line-clamp-2 text-foreground/90 group-hover:text-primary transition-colors" title={item.media.title}>
                          {item.media.title}
                        </h4>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PAGINAÇÃO */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Total: {totalItems} itens
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                    className="h-8 px-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <span className="text-xs font-medium min-w-[60px] text-center">
                    Pág {page} de {totalPages || 1}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= totalPages || isLoading}
                    className="h-8 px-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}