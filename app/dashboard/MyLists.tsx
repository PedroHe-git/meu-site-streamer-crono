"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Media, MediaStatus, MediaType } from "@prisma/client";
import { FiRefreshCw } from 'react-icons/fi';
// --- Importa componentes Tabs e outros ---
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
// --- [NOVO] Importa MediaSearch e Separator ---
import { Separator } from "@/components/ui/separator";
import MediaSearch from "./MediaSearch";

// Tipagem
type MediaStatusWithMedia = MediaStatus & { media: Media };
type StatusKey = "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED";
type ListTab = StatusKey;
type PaginatedListData = { items: MediaStatusWithMedia[]; totalCount: number; page: number; pageSize: number; };

// --- [NOVO] Prop 'onMediaAdded' adicionada ---
type MyListsProps = { 
  toWatchData: PaginatedListData; 
  watchingData: PaginatedListData; 
  watchedData: PaginatedListData; 
  droppedData: PaginatedListData; 
  onUpdateStatus: (item: MediaStatusWithMedia, newStatus: StatusKey) => void; 
  onPageChange: (listStatus: StatusKey, newPage: number) => void; 
  onToggleWeekly: (item: MediaStatusWithMedia) => void; 
  listLoadingStatus: Record<StatusKey, boolean>; 
  searchTerm: string; 
  setSearchTerm: (term: string) => void; 
  isUpdatingGlobal: boolean; 
  onMediaAdded: () => void; // <-- Prop para o MediaSearch
};

// ActionButton
type ActionButtonProps = { onClick: () => void; label: string; colorClass: string; disabled: boolean; };
function ActionButton({ onClick, label, colorClass, disabled }: ActionButtonProps) { return ( <Button onClick={onClick} disabled={disabled} size="sm" className={`h-6 px-2 text-xs ${colorClass} hover:${colorClass}/90`} > {label} </Button> ); }


// Componente Principal
export default function MyLists({
  toWatchData, watchingData, watchedData, droppedData,
  onUpdateStatus, onPageChange, onToggleWeekly,
  listLoadingStatus, searchTerm, setSearchTerm, isUpdatingGlobal,
  onMediaAdded // <-- Recebe a prop
}: MyListsProps) {

  const [activeTab, setActiveTab] = useState<ListTab>("TO_WATCH");

  const paginatedDataMap: Record<ListTab, PaginatedListData> = { TO_WATCH: toWatchData, WATCHING: watchingData, WATCHED: watchedData, DROPPED: droppedData, };
  
  // --- [CORREÇÃO] Lógica interna restaurada ---
  const currentData = paginatedDataMap[activeTab];
  const isLoadingCurrentList = listLoadingStatus[activeTab]; // <-- Variável que faltava
  const totalPages = Math.ceil(currentData.totalCount / currentData.pageSize);
  // --- [FIM CORREÇÃO] ---

  // renderListItem (com todas as correções de cor)
  const renderListItem = (item: MediaStatusWithMedia, listStatus: StatusKey) => {
    let actionButtons;
    const isUpdating = isUpdatingGlobal || isLoadingCurrentList; // <-- Agora funciona
    const isWeekly = item.isWeekly;
    const isSerieOrAnime = item.media.mediaType === MediaType.SERIES || item.media.mediaType === MediaType.ANIME;

    switch (item.status) {
      case "TO_WATCH": actionButtons = ( <div className="flex flex-col sm:flex-row gap-1"> <ActionButton label="Começar" colorClass="bg-blue-600" disabled={isUpdating} onClick={() => onUpdateStatus(item, "WATCHING")} /> <ActionButton label="Já Vi" colorClass="bg-yellow-500" disabled={isUpdating} onClick={() => onUpdateStatus(item, "WATCHED")} /> <ActionButton label="Abandonar" colorClass="bg-red-600" disabled={isUpdating} onClick={() => onUpdateStatus(item, "DROPPED")} /> </div> ); break;
      case "WATCHING":
        actionButtons = (
          <div className="flex flex-col sm:flex-row gap-1 items-center">
            {isSerieOrAnime && ( <div className="flex items-center mr-2"> <Checkbox id={`weekly-${item.id}`} checked={isWeekly} onCheckedChange={() => onToggleWeekly(item)} disabled={isUpdating} className="h-4 w-4" /> <Label htmlFor={`weekly-${item.id}`} className="ml-1 text-xs text-muted-foreground cursor-pointer" title="Marcar como item semanal"> Semanal </Label> </div> )}
            <ActionButton label="Abandonar" colorClass="bg-red-600" disabled={isUpdating} onClick={() => onUpdateStatus(item, "DROPPED")} />
            <ActionButton label="Pausar" colorClass="bg-yellow-600" disabled={isUpdating} onClick={() => onUpdateStatus(item, "TO_WATCH")} />
          </div>
        ); break;
      case "WATCHED": actionButtons = ( <ActionButton label="Ver de Novo" colorClass="bg-green-600" disabled={isUpdating} onClick={() => onUpdateStatus(item, "TO_WATCH")} /> ); break;
      case "DROPPED": actionButtons = ( <ActionButton label="Tentar de Novo" colorClass="bg-blue-600" disabled={isUpdating} onClick={() => onUpdateStatus(item, "TO_WATCH")} /> ); break;
    }

    const showProgress = isSerieOrAnime && (item.lastSeasonWatched !== null || item.lastEpisodeWatched !== null);

    return (
      <li key={item.id} className="flex items-center justify-between gap-2 p-2 border-b last:border-b-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <Image src={item.media.posterPath || "/poster-placeholder.png"} width={40} height={60} alt={item.media.title} className="rounded flex-shrink-0" unoptimized={true} />
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm truncate font-medium flex items-center gap-1 text-foreground" title={item.media.title}>
              {item.media.title}
              {isWeekly && item.status === 'WATCHING' && ( <FiRefreshCw className="text-blue-500 flex-shrink-0" title="Item Semanal" /> )}
            </span>
            {showProgress && item.status !== 'TO_WATCH' && (
              <span className="text-xs font-bold text-primary">
                {item.status === 'WATCHING' && isWeekly ? 'Progresso:' : 'Visto até:'}
                {item.lastSeasonWatched && ` T${item.lastSeasonWatched}`}
                {item.lastEpisodeWatched && !item.lastEpisodeWatchedEnd && ` E${item.lastEpisodeWatched}`}
                {item.lastEpisodeWatched && item.lastEpisodeWatchedEnd && ` E${item.lastEpisodeWatched}-${item.lastEpisodeWatchedEnd}`}
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">{actionButtons}</div>
      </li>
    );
  };

  // renderTabContent (com todas as correções de cor)
  const renderTabContent = (statusKey: StatusKey) => { 
    const data = paginatedDataMap[statusKey]; 
    const isLoading = listLoadingStatus[statusKey]; 
    const totalPages = Math.ceil(data.totalCount / data.pageSize); 
    return ( 
      <div className="mt-4"> 
        <div className="min-h-[200px] relative"> 
          {isLoading && ( 
            <div className="absolute inset-0 bg-background/75 flex items-center justify-center z-10 rounded-md"> 
              <span className="text-muted-foreground">A carregar...</span> 
            </div> 
          )} 
          {!isLoading && data.items.length === 0 ? ( 
            <p className="text-muted-foreground text-sm text-center py-10"> 
              {searchTerm ? "Nenhum item encontrado." : "Nenhum item nesta lista."} 
            </p> 
          ) : ( 
            <ul className="space-y-1"> 
              {!isLoading && data.items.map(item => renderListItem(item, statusKey))} 
            </ul> 
          )} 
        </div> 
        {!isLoading && totalPages > 1 && ( 
          <div className="flex justify-between items-center mt-4 pt-4 border-t text-sm"> 
            <Button onClick={() => onPageChange(statusKey, data.page - 1)} disabled={data.page <= 1 || isLoading} variant="outline" size="sm"> &larr; Anterior </Button> 
            <span className="text-muted-foreground"> Página {data.page} de {totalPages} </span> 
            <Button onClick={() => onPageChange(statusKey, data.page + 1)} disabled={data.page >= totalPages || isLoading} variant="outline" size="sm"> Próxima &rarr; </Button> 
          </div> 
        )} 
      </div> 
    ); 
  };

  // --- [NOVO] Return atualizado com MediaSearch ---
  return (
    <div className="flex flex-col">
      
      {/* 1. Componente de Busca */}
      <MediaSearch onMediaAdded={onMediaAdded} />
      
      {/* 2. Separador */}
      <Separator className="my-6" />

      {/* 3. Barra de Filtro das Listas */}
      <div className="mb-4">
        <Input 
          type="text" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="Filtrar listas..." 
          className="placeholder:text-muted-foreground"
        /> 
      </div>

      {/* 4. Abas das Listas */}
      <Tabs defaultValue="TO_WATCH" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto mb-4">
          <TabsTrigger value="TO_WATCH" className="text-xs sm:text-sm px-1 h-full whitespace-normal">Para Assistir ({toWatchData.totalCount})</TabsTrigger>
          <TabsTrigger value="WATCHING" className="text-xs sm:text-sm px-1 h-full whitespace-normal">Assistindo ({watchingData.totalCount})</TabsTrigger>
          <TabsTrigger value="WATCHED" className="text-xs sm:text-sm px-1 h-full whitespace-normal">Já Assistido ({watchedData.totalCount})</TabsTrigger>
          <TabsTrigger value="DROPPED" className="text-xs sm:text-sm px-1 h-full whitespace-normal">Abandonados ({droppedData.totalCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="TO_WATCH">{renderTabContent("TO_WATCH")}</TabsContent>
        <TabsContent value="WATCHING">{renderTabContent("WATCHING")}</TabsContent>
        <TabsContent value="WATCHED">{renderTabContent("WATCHED")}</TabsContent>
        <TabsContent value="DROPPED">{renderTabContent("DROPPED")}</TabsContent>
      </Tabs>
    </div>
  );
}