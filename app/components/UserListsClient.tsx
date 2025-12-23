"use client";

import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListChecks, Clock, CheckCircle2, XCircle, MonitorPlay, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UserListsClientProps {
  username: string;
  isOwner: boolean;
  counts: any;
  showToWatchList: boolean;
  showWatchingList: boolean;
  showWatchedList: boolean;
  showDroppedList: boolean;
  isCompact?: boolean;
  itemsPerPage?: number;
  searchTerm?: string;
}

export default function UserListsClient({
  username,
  isOwner,
  counts,
  showToWatchList,
  showWatchingList,
  showWatchedList,
  showDroppedList,
  isCompact = false,
  itemsPerPage = 12,
  searchTerm = "", 
}: UserListsClientProps) {

  // Lógica de Abas
  const defaultTab =
    (showWatchingList && "WATCHING") ||
    (showToWatchList && "TO_WATCH") ||
    (showWatchedList && "WATCHED") ||
    (showDroppedList && "DROPPED") ||
    "WATCHED";

  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Estados de Dados
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  // 1. Busca os dados (Cache - Traz tudo de uma vez)
  useEffect(() => {
    async function fetchList() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/mediastatus?status=${activeTab}&page=1&pageSize=2000`);
        const data = await res.json();
        setItems(data.items || []);
      } catch (error) {
        console.error("Erro lista:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchList();
  }, [activeTab]);

  // Reseta página ao mudar aba ou busca
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchTerm]);

  // 2. Filtra na memória (Rápido)
  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter(item => 
      item.media?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  // 3. Pagina os resultados filtrados
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Configuração Visual das Abas
  const tabs = [
    { key: "WATCHING", show: showWatchingList, label: "Assistindo", count: counts.WATCHING, Icon: Clock },
    { key: "TO_WATCH", show: showToWatchList, label: "Para Assistir", count: counts.TO_WATCH, Icon: ListChecks },
    { key: "WATCHED", show: showWatchedList, label: "Assistidos", count: counts.WATCHED, Icon: CheckCircle2 },
    { key: "DROPPED", show: showDroppedList, label: "Drops", count: counts.DROPPED, Icon: XCircle },
  ];

  const activeListCount = tabs.filter(tab => tab.show).length;

  return (
    <div className="w-full space-y-6">
      
      {/* ABAS (Correção Visual Aqui 👇) */}
      {activeListCount > 1 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className="
              flex
              flex-wrap 
              w-full
              justify-start
              gap-2
              p-0
              bg-transparent
              border-0
              h-auto
            "
          >
            {tabs
              .filter(tab => tab.show)
              .map(({ key, label, count, Icon }) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="
                    flex
                    items-center
                    gap-0
                    px-3
                    py-5
                    rounded-lg
                    bg-transparent
                    border border-transparent
                    text-gray-400
                    hover:text-white hover:bg-white/5
                    transition-all
                    data-[state=active]:bg-purple-600
                    data-[state=active]:text-white
                    data-[state=active]:shadow-md
                  "
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium whitespace-nowrap">{label}</span>
                  <span className="text-xs font-bold bg-black/20 px-1.5 rounded-full min-w-[20px] text-center">
                    {count || 0}
                  </span>
                </TabsTrigger>
              ))}
          </TabsList>
        </Tabs>
      ) : null}

      {/* CONTEÚDO */}
      <div className="min-h-[300px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-purple-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-xs text-gray-500 uppercase tracking-widest">Carregando...</p>
          </div>
        ) : paginatedItems.length === 0 ? (
           <div className="text-center py-16 border border-dashed border-gray-800 rounded-xl bg-gray-900/20">
              <p className="text-gray-500 font-medium">
                 {searchTerm ? `Sem resultados para "${searchTerm}"` : "Lista vazia."}
              </p>
           </div>
        ) : (
          <>
            {/* GRID DE ITENS - TAMANHO AUMENTADO */}
            <div className={cn(
              "grid gap-4 animate-in fade-in zoom-in-95 duration-500",
              // 👇 AQUI ESTÁ A MUDANÇA:
              // Antes: lg:grid-cols-5 (Pequeno)
              // Agora: lg:grid-cols-4 (Maior)
              isCompact 
                ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
                : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            )}>
              {paginatedItems.map((item) => (
                <div key={item.id} className="group relative aspect-[2/3] bg-gray-900 rounded-lg overflow-hidden border border-white/5 hover:border-purple-500/50 hover:shadow-purple-900/20 hover:shadow-xl transition-all duration-300">
                  {item.media?.posterPath ? (
                    <Image
                      src={item.media.posterPath}
                      alt={item.media.title}
                      fill
                      // Ajustei o sizes para o navegador baixar imagens de melhor qualidade já que ficaram maiores
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className={cn("object-cover transition-transform duration-500 group-hover:scale-105", 
                        activeTab === 'DROPPED' && "grayscale opacity-60"
                      )}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-gray-600 gap-2">
                      <MonitorPlay className="w-8 h-8 opacity-50" />
                      <span className="text-[10px] uppercase font-bold">Sem Capa</span>
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 p-4 flex flex-col justify-end">
                     <p className="text-white text-sm font-bold line-clamp-2 leading-snug mb-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                       {item.media?.title}
                     </p>
                     <div className="flex gap-1 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                        <Badge variant="outline" className="text-[10px] h-5 px-2 border-white/20 text-gray-300">
                           {item.media?.mediaType === 'MOVIE' ? 'Filme' : item.media?.mediaType === 'TV' ? 'Série' : 'Anime'}
                        </Badge>
                     </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8 pt-4 border-t border-gray-800/50">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)}
                  className="hover:bg-purple-500/10 hover:text-purple-400"
                >
                  Anterior
                </Button>
                <span className="text-xs text-gray-500 font-mono">
                  {page} / {totalPages}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={page === totalPages} 
                  onClick={() => setPage(p => p + 1)}
                  className="hover:bg-purple-500/10 hover:text-purple-400"
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}