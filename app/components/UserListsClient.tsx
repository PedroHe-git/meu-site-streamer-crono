"use client";

import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListChecks, Clock, CheckCircle2, XCircle, MonitorPlay, Loader2, Trophy, Eye, Lock } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UserListsClientProps {
  username: string;
  isOwner: boolean;
  counts: any;
  privacySettings: {
    showWatching: boolean;
    showToWatch: boolean;
    showWatched: boolean;
    showDropped: boolean;
  };
  isCompact?: boolean;
  itemsPerPage?: number;
  searchTerm?: string;
  gridClassName?: string;
}

export default function UserListsClient({
  username,
  isOwner,
  counts,
  privacySettings,
  isCompact = false,
  itemsPerPage = 6,
  searchTerm = "",
  gridClassName,
}: UserListsClientProps) {

  const getInitialTab = () => {
      const canShow = (setting: boolean) => isOwner || setting;
      if (canShow(privacySettings.showWatching)) return "WATCHING";
      if (canShow(privacySettings.showToWatch)) return "TO_WATCH";
      if (canShow(privacySettings.showWatched)) return "WATCHED";
      if (canShow(privacySettings.showDropped)) return "DROPPED";
      return "NONE";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [page, setPage] = useState(1);

  // Função auxiliar para calcular temporadas
  const getLastCompletedSeason = (progress: any) => {
    if (!progress) return null;
    const seasons = Object.entries(progress)
      .filter(([_, isWatched]) => isWatched === true)
      .map(([season]) => parseInt(season))
      .sort((a, b) => b - a);
    return seasons.length > 0 ? seasons[0] : null;
  };

  useEffect(() => {
    async function fetchList() {
      if (activeTab === "NONE") { setIsLoading(false); return; }
      setIsLoading(true);
      setIsPrivate(false);
      try {
        const res = await fetch(`/api/users/${username}/lists?status=${activeTab}&page=1&limit=2000`);
        const data = await res.json();
        
        if (data.isPrivate) {
            setIsPrivate(true);
            setItems([]);
        } else {
            setItems(data.items || []);
        }
      } catch (error) { console.error("Erro lista:", error); } 
      finally { setIsLoading(false); }
    }
    if (username) fetchList();
  }, [activeTab, username]);

  useEffect(() => { setPage(1); }, [activeTab, searchTerm]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter(item => item.media?.title?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [items, searchTerm]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const tabs = [
    { key: "WATCHING", show: privacySettings.showWatching, label: "Assistindo", count: counts.WATCHING, Icon: Clock },
    { key: "TO_WATCH", show: privacySettings.showToWatch, label: "Para Assistir", count: counts.TO_WATCH, Icon: ListChecks },
    { key: "WATCHED", show: privacySettings.showWatched, label: "Assistidos", count: counts.WATCHED, Icon: CheckCircle2 },
    { key: "DROPPED", show: privacySettings.showDropped, label: "Drops", count: counts.DROPPED, Icon: XCircle },
  ];

  return (
    <div className="w-full space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap w-full justify-start gap-2 p-0 bg-transparent border-0 h-auto">
            {tabs.map(({ key, label, count, Icon, show }) => {
                if (!isOwner && !show) return null;
                return (
                    <TabsTrigger key={key} value={key} className="flex items-center gap-1 px-2 py-3 rounded-lg bg-transparent border border-transparent text-gray-400 hover:text-white hover:bg-white/5 transition-all data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-sm font-medium whitespace-nowrap">{label}</span>
                        <span className="text-xs font-bold bg-black/20 px-1.5 rounded-full min-w-[20px] text-center">{count || 0}</span>
                        {!show && isOwner && <Lock className="w-3 h-3 text-white/50 ml-1" />}
                    </TabsTrigger>
                );
            })}
          </TabsList>
      </Tabs>

      <div className="min-h-[300px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-purple-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-xs text-gray-500 uppercase tracking-widest">Carregando...</p>
          </div>
        ) : isPrivate ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
                <Lock className="w-10 h-10 opacity-50" />
                <p>Esta lista é privada.</p>
            </div>
        ) : paginatedItems.length === 0 ? (
           <div className="text-center py-16 border border-dashed border-gray-800 rounded-xl bg-gray-900/20"><p className="text-gray-500 font-medium">Lista vazia.</p></div>
        ) : (
          <>
            <div className={cn(
                "grid gap-4 animate-in fade-in zoom-in-95 duration-500", 
                gridClassName ? gridClassName : (isCompact ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5")
            )}>
              {paginatedItems.map((item) => {
                const isSeriesOrAnime = item.media?.mediaType === "SERIES" || item.media?.mediaType === "ANIME";
                
                // 👇 LÓGICA CORRIGIDA TAMBÉM NO HISTÓRICO
                const completedSeason = getLastCompletedSeason(item.seasonProgress);
                const currentTracking = item.lastSeasonWatched || completedSeason;

                return (
                <div key={item.id} className="group relative aspect-[2/3] bg-gray-900 rounded-lg overflow-hidden border border-white/5 hover:border-purple-500/50 transition-all duration-300">
                  {item.media?.posterPath ? (
                    <Image src={item.media.posterPath} alt={item.media.title} fill className={cn("object-cover transition-transform duration-500 group-hover:scale-105", activeTab === 'DROPPED' && "grayscale opacity-60")} unoptimized={true} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-gray-600 gap-2"><MonitorPlay className="w-8 h-8 opacity-50" /><span className="text-[10px] uppercase font-bold">Sem Capa</span></div>
                  )}

                  {isSeriesOrAnime && (
                    <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex justify-center z-10">
                        {activeTab === "WATCHED" ? (
                            completedSeason ? (
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full backdrop-blur-md shadow-lg">
                                    <Trophy className="w-3 h-3 text-yellow-500" />
                                    <span className="text-[10px] font-bold text-yellow-100 uppercase tracking-wide">S{completedSeason} Completa</span>
                                </div>
                            ) : null
                        ) : (
                            currentTracking ? (
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-600/90 border border-purple-400/30 rounded-full backdrop-blur-md shadow-lg">
                                    <Eye className="w-3 h-3 text-white" />
                                    <span className="text-[10px] font-bold text-white uppercase tracking-wide">Vendo Temp. {currentTracking}</span>
                                </div>
                            ) : null
                        )}
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-start">
                     <div className="flex justify-end w-full mb-2">
                        <Badge variant="outline" className="text-[10px] h-5 px-2 border-white/20 text-gray-300 bg-black/50">{item.media?.mediaType}</Badge>
                     </div>
                     <p className="text-white text-sm font-bold line-clamp-3 leading-snug mt-auto">{item.media?.title}</p>
                  </div>
                </div>
              )})}
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8 pt-4 border-t border-gray-800/50">
                <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                <span className="text-xs text-gray-500 font-mono">{page} / {totalPages}</span>
                <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Próxima</Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}