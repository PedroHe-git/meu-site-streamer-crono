"use client";

import { useState, useEffect, useCallback } from "react";
import { Media, MediaStatus } from "@prisma/client";
import { Loader2, Trash2, CheckCircle2, PlayCircle, Plus, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  
  // Paginação
  const [page, setPage] = useState(1);
  const pageSize = 16;
  const [totalItems, setTotalItems] = useState(0);

  const [counts, setCounts] = useState({
    WATCHING: 0,
    TO_WATCH: 0,
    WATCHED: 0,
    DROPPED: 0
  });

  // Reseta página ao trocar aba para evitar erro de página inexistente no novo status
  useEffect(() => { 
    setPage(1); 
  }, [activeTab]);

  // 1. Atualiza contadores usando cache: 'no-store' para precisão no dashboard
  const fetchAllCounts = useCallback(async () => {
    const statuses = ["WATCHING", "TO_WATCH", "WATCHED", "DROPPED"];
    try {
      const promises = statuses.map(s => 
        fetch(`/api/mediastatus?status=${s}&page=1&pageSize=1`, { cache: 'no-store' }).then(r => r.json())
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

  // 2. Busca Lista Atual - CORREÇÃO: cache: 'no-store' e substituição total do estado
  const fetchList = useCallback(async () => {
    setIsLoading(true);
    try {
      // Adicionamos cache: 'no-store' para garantir que o Dashboard ignore o cache da Vercel
      const res = await fetch(
        `/api/mediastatus?status=${activeTab}&page=${page}&pageSize=${pageSize}`,
        { cache: 'no-store' }
      );
      if (!res.ok) throw new Error("Erro ao buscar lista");
      const data = await res.json();
      
      // 🛑 CORREÇÃO: setItems(data.items) substitui a lista, impedindo duplicatas na paginação
      setItems(data.items || []);
      setTotalItems(data.total || 0);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar lista.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, toast]);

  useEffect(() => {
    fetchList();
    fetchAllCounts();
  }, [fetchList, fetchAllCounts, dataVersionKey]);

  const handleMove = async (id: string, newStatus: string) => {
    setIsActionLoading(id);
    try {
      const res = await fetch(`/api/mediastatus`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) throw new Error("Erro ao mover");
      
      toast({ title: "Movido!", description: `Item movido para ${newStatus}` });
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
        <div className="flex items-center justify-between mb-4 overflow-x-auto pb-2 sm:pb-0">
          <TabsList className="bg-muted/50 p-1 h-auto">
            {renderTabTrigger("WATCHING", "Essa Semana", counts.WATCHING)}
            {renderTabTrigger("TO_WATCH", "Para Assistir", counts.TO_WATCH)}
            {renderTabTrigger("WATCHED", "Concluídos", counts.WATCHED)}
            {renderTabTrigger("DROPPED", "Dropados", counts.DROPPED)}
          </TabsList>
        </div>

        <div className="min-h-[300px]">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 border border-dashed rounded-xl bg-muted/10">
              <p className="text-sm text-muted-foreground">Esta lista está vazia.</p>
            </div>
          ) : (
            <TabsContent value={activeTab} className="mt-0 space-y-6">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 animate-in fade-in">
                {items.map((item) => (
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
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
                          <PlayCircle className="w-8 h-8 opacity-20" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/10 hover:bg-white text-white hover:text-black border-0 backdrop-blur-sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center">
                            <DropdownMenuLabel>Mover para...</DropdownMenuLabel>
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

                      <div className="absolute top-1 right-1 pointer-events-none">
                         <Badge variant="secondary" className="text-[8px] h-4 px-1 bg-black/70 backdrop-blur border-0 text-white font-normal">
                            {item.media.mediaType === "MOVIE" ? "Filme" : item.media.mediaType === "ANIME" ? "Anime" : "Série"}
                         </Badge>
                      </div>
                    </div>

                    <div className="px-0.5">
                      <h4 className="text-[11px] font-medium leading-tight line-clamp-2 text-foreground/90 group-hover:text-primary transition-colors" title={item.media.title}>
                        {item.media.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>

              {/* PAGINAÇÃO FIXA */}
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